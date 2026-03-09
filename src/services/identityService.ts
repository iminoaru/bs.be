import { supabase } from '../db';
import { Contact, IdentifyResponse } from '../types';

export const reconcileIdentity = async (email?: string, phoneNumber?: string): Promise<IdentifyResponse> => {
    let query = supabase.from('contacts').select('*');

    if (email && phoneNumber) {
        query = query.or(`email.eq.${email},phone_number.eq.${phoneNumber}`);
    } else if (email) {
        query = query.eq('email', email);
    } else if (phoneNumber) {
        query = query.eq('phone_number', phoneNumber);
    }

    const { data: directMatches, error: matchError } = await query;

    if (matchError) throw matchError;

    if (!directMatches || directMatches.length === 0) {
        const { data: newContact, error: insertError } = await supabase
            .from('contacts')
            .insert({
                email: email || null,
                phone_number: phoneNumber || null,
                link_precedence: 'primary'
            })
            .select()
            .single();

        if (insertError) throw insertError;
        const contact = newContact as Contact;

        return {
            contact: {
                primaryContatctId: contact.id,
                emails: contact.email ? [contact.email] : [],
                phoneNumbers: contact.phone_number ? [contact.phone_number] : [],
                secondaryContactIds: []
            }
        };
    }

    const primaryIds = new Set<number>();
    for (const match of directMatches as Contact[]) {
        if (match.link_precedence === 'primary') {
            primaryIds.add(match.id);
        } else if (match.linked_id) {
            primaryIds.add(match.linked_id);
        }
    }

    const primaryIdsArr = Array.from(primaryIds);

    const { data: relatedById, error: err1 } = await supabase
        .from('contacts')
        .select('*')
        .in('id', primaryIdsArr);

    const { data: relatedByLinked, error: err2 } = await supabase
        .from('contacts')
        .select('*')
        .in('linked_id', primaryIdsArr);

    if (err1) throw err1;
    if (err2) throw err2;

    const allRelatedMap = new Map<number, Contact>();
    (relatedById as Contact[]).forEach(c => allRelatedMap.set(c.id, c));
    (relatedByLinked as Contact[]).forEach(c => allRelatedMap.set(c.id, c));

    let contacts = Array.from(allRelatedMap.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const primaryContact = contacts.find(c => c.link_precedence === 'primary') || contacts[0];

    const otherPrimaries = contacts.filter(
        c => c.link_precedence === 'primary' && c.id !== primaryContact.id
    );

    if (otherPrimaries.length > 0) {
        const idsToUpdate = otherPrimaries.map(c => c.id);
        await supabase
            .from('contacts')
            .update({ link_precedence: 'secondary', linked_id: primaryContact.id, updated_at: new Date().toISOString() })
            .in('id', idsToUpdate);

        await supabase
            .from('contacts')
            .update({ linked_id: primaryContact.id, updated_at: new Date().toISOString() })
            .in('linked_id', idsToUpdate);

        contacts = contacts.map(c => {
            if (idsToUpdate.includes(c.id)) {
                return { ...c, link_precedence: 'secondary', linked_id: primaryContact.id };
            }
            if (c.linked_id && idsToUpdate.includes(c.linked_id)) {
                return { ...c, linked_id: primaryContact.id };
            }
            return c;
        });
    }

    const hasNewEmail = email && !contacts.some(c => c.email === email);
    const hasNewPhone = phoneNumber && !contacts.some(c => c.phone_number === phoneNumber);

    if (hasNewEmail || hasNewPhone) {
        const { data: newSecondary, error: secondaryError } = await supabase
            .from('contacts')
            .insert({
                email: email || null,
                phone_number: phoneNumber || null,
                linked_id: primaryContact.id,
                link_precedence: 'secondary'
            })
            .select()
            .single();

        if (secondaryError) throw secondaryError;
        contacts.push(newSecondary as Contact);
    }

    const emailsSet = new Set<string>();
    if (primaryContact.email) emailsSet.add(primaryContact.email);

    const phonesSet = new Set<string>();
    if (primaryContact.phone_number) phonesSet.add(primaryContact.phone_number);

    const secondaryIds: number[] = [];

    for (const c of contacts) {
        if (c.id === primaryContact.id) continue;

        if (c.email) emailsSet.add(c.email);
        if (c.phone_number) phonesSet.add(c.phone_number);
        secondaryIds.push(c.id);
    }

    return {
        contact: {
            primaryContatctId: primaryContact.id,
            emails: Array.from(emailsSet),
            phoneNumbers: Array.from(phonesSet),
            secondaryContactIds: secondaryIds
        }
    };
};
