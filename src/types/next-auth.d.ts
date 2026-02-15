import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: 'Admin' | 'Team' | 'AgencyAdmin' | 'AgencyTeam' | 'Client'
            agency_id?: number
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        role: 'Admin' | 'Team' | 'AgencyAdmin' | 'AgencyTeam' | 'Client'
        agency_id?: number
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: 'Admin' | 'Team' | 'AgencyAdmin' | 'AgencyTeam' | 'Client'
        agency_id?: number
        id: string
    }
}
