"use server"

import {z} from "zod"
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {signIn} from "../../authentication"
import { AuthError } from "next-auth";
const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require"})

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: "PLease select a customer",
    }),
    amount: z.coerce.number().gt(0, {message: "Please enter a number greater than 0"}), // coerce.number() = coerce(change) to a number
    status: z.enum(["pending", "paid"], {
        invalid_type_error: "Please select an invoice status"
    }),
    date: z.string()
})

const invoiceOmits = FormSchema.omit({id: true, date: true});

export async function createInvoices (prevState: State ,formData: FormData) {

    const validatedFields = invoiceOmits.safeParse({ // with the parse we check the values
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Create Invoice. "
        }
    }

    const {customerId, amount, status} = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split("T")[0];

    try {
        // insert data into database
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `
    } catch (error) {
        return {message: "Database Error: Failed to create invoice"}
    }

    // after every insertion of data to database a fresh data will be fetched from the server
    revalidatePath("/dashboard/invoices")
    redirect("/dashboard/invoices");
}

export async function updateInvoice (id: string,  prevState: State, formData: FormData,) {

    const validatedFileds = invoiceOmits.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
    
    if (!validatedFileds.success) {
        return {
            errors: validatedFileds.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Create Invoice"
        }
    }

    const {customerId, amount, status} = validatedFileds.data;
    const amountInCents = amount * 100;

    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
    `
    } catch (error) {
        return {
            message: "Database Error. Failed to Edit Invoice"
        }
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

export async function authenticate (prevState: State, formData: FormData) {

    try {
        
        await signIn("credentials", formData)
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case ("CredentialsSingin"):
                    return "Invalid credentials."
                default :
                    return "Something went wrong"
            }
        }
        throw error
    }
}