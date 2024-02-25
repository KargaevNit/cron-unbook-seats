import {createClient} from "@supabase/supabase-js";

const key = process.env.SB_KEY;
const url = process.env.SB_URL;

const timeoutPayments = 5;
const timeoutSeats = 5;

if(typeof key === 'undefined' || typeof url === 'undefined') {
    throw { err: "Key and URL required!" }
}

const supabase = createClient(url, key);

// Reject timeout payments
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
        payment_date.setMinutes(payment_date.getMinutes() + timeoutPayments);
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
        .in('payment_id', rejectedPaymentsIds);
})();


// Delete timeout booking seats
(async () => {
    const seats_res = await supabase
        .from("MovieBookingSeat")
        .select()
        .eq("payment_id", "null");

    const seats = seats_res.data;

    if(!seats) { return; }

    const deleteSeats: any[] = [];
    seats.forEach((seat) => {
        const seat_date = new Date(seat.created_at);
        seat_date.setMinutes(seat_date.getMinutes() + timeoutSeats);
        if(seat_date < (new Date())) { deleteSeats.push(seat.id) }
    });

    if(deleteSeats.length === 0) { return; }

    await supabase
        .from("MovieBookingSeat")
        .delete()
        .in("id", deleteSeats);
})();

