/** Interface representing a contact in the application */
export interface Contact {
    /** Unique database ID of the contact */
    id?: number
    /** Full name of the contact */
    name: string
    /** Email address of the contact */
    email: string
    /** Phone number of the contact */
    phone: string
    /** Unique styling color code associated with the contact avatar */
    color?: string
}
