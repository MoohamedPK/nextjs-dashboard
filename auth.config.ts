import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login"
    },

    callbacks: {
        authorized({auth, request: {nextUrl}}) {

            const isLoggeIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

            if (isOnDashboard) {
                if (isLoggeIn) return true;
                return false
            } else if (isLoggeIn) {
                return Response.redirect(new URL("/dashboard", nextUrl));
            }
            return true
        }
    },

    providers: []
} satisfies NextAuthConfig;