declare module "../services/auth-mail.service.js" {
    export const hashOtpCode: (value: string) => string;
    export const sendSignupVerificationEmail: (
        to: string,
        name: string,
        verificationLink: string
    ) => Promise<void>;
    export const sendPasswordResetEmail: (to: string, resetLink: string) => Promise<void>;
}
