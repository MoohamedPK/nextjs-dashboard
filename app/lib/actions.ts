"use server"

import {z} from "zod"
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require"})

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(), // coerce.number() = coerce(change) to a number
    status: z.enum(["pending", "paid"]),
    date: z.string()
})

const invoiceOmits = FormSchema.omit({id: true, date: true});

export async function createInvoices (formData: FormData) {

    const {customerId, amount, status} = invoiceOmits.parse({ // with the parse we check the values
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
    });
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split("T")[0];

    try {
        // insert data into database
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `

    } catch (error) {
        console.log(error);
    }

    // after every insertion of data to database a fresh data will be fetched from the server
    revalidatePath("/dashboard/invoices")
    redirect("/dashboard/invoices");
}

export async function updateInvoice (id: string, formData: FormData) {
    const {customerId, amount, status} = invoiceOmits.parse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
    })

    const amountInCents = amount * 100;

    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
    `
    } catch (error) {
        console.log(error)
    }

        revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
}


export async function deleteInvoice (id: string) {

    await sql`
    DELETE FROM invoices 
    WHERE id = ${id}
`;
    revalidatePath("/dashboard/invoices");

}