"use server";
import { neon } from "@neondatabase/serverless";
import { env, assertDatabaseEnv } from "../lib/env";

export async function getData() {
    assertDatabaseEnv();
    const sql = neon(env.DATABASE_URL);
    const data = await sql`...`;
    return data;
}