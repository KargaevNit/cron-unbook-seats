import {createClient} from "@supabase/supabase-js";

const key = process.env.SB_KEY;
const url = process.env.SB_URL;

if(typeof key === 'undefined' || typeof url === 'undefined') {
    throw { err: "Key and URL required!" }
}

const supabase = createClient(url, key);
(async () => {
    const response = await supabase
        .from("Payments")
        .select("*")
        .eq('is_paid', false)
        .eq('status', "NEW")

    const payments = response.data;
    if(!payments) { return; }

    const rejectedPaymentsIds: any[] = [];
    payments.forEach(payment => {
        const payment_date = new Date(payment.created_at);
        payment_date.setMinutes(payment_date.getMinutes() + 5);
        if(payment_date < (new Date())) { rejectedPaymentsIds.push(payment.id) }
    });

    if(rejectedPaymentsIds.length === 0) { return; }

    await supabase
        .from("Payments")
        .update({ status: "REJECT" })
        .in('id', rejectedPaymentsIds);

    await supabase
        .from("MovieBookingSeat")
        .delete()
        .in('payment_id', rejectedPaymentsIds)
})();

