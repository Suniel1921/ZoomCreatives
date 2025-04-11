// import React, { useState } from 'react';
// import { Modal, Input, Button, Form } from 'antd';
// import axios from 'axios';
// import { toast } from "react-hot-toast";
// // import './ForgotPasswordModal.css';  //note: need to fix this later 

// const ForgotPasswordModal = ({ visible, onClose }) => {
//     const [step, setStep] = useState(1); 
//     const [email, setEmail] = useState('');
//     const [otp, setOtp] = useState('');
//     const [newPassword, setNewPassword] = useState('');
//     const [confirmPassword, setConfirmPassword] = useState('');
//     const [loading, setLoading] = useState(false); 

//     const buttonStyle = {
//         backgroundColor: '#FEDC00',
//         borderColor: '#FEDC00',
//         color: '#000',
//     };

//     const handleEmailSubmit = async () => {
//         setLoading(true);
//         try {
//             const response = await axios.post(`${import.meta.env.VITE_REACT_APP_URL}/api/v1/auth/forgotPassword`, { email });
//             if (response.data.success) {
//                 toast.success(response.data.message);
//                 setStep(2);
//             } else {
//                 toast.error(response.data.message);
//             }
//         } catch (error) {
//             toast.error(error.response?.data?.message || 'Error occurred');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleResetPassword = async () => {
//         if (newPassword !== confirmPassword) {
//             return toast.error('Passwords do not match');
//         }
//         setLoading(true); 
//         try {
//             const response = await axios.post(`${import.meta.env.VITE_REACT_APP_URL}/api/v1/auth/resetPassword`, { email, otp, newPassword });
//             if (response.data.success) {
//                 toast.success(response.data.message);
//                 onClose();
//             } else {
//                 toast.error(response.data.message);
//             }
//         } catch (error) {
//             toast.error(error.response?.data?.message || 'Error occurred');
//         } finally {
//             setLoading(false); 
//         }
//     };

//     return (
//         <Modal open={visible} onCancel={onClose} footer={null}>
//             <h3>{step === 1 ? 'Forgot Password' : 'Reset Password'}</h3>
//             {step === 1 ? (
//                 <Form onFinish={handleEmailSubmit}>
//                     <Form.Item
//                         label="Email"
//                         name="email"
//                         rules={[{ required: true, message: 'Please enter your email' }]}
//                     >
//                         <Input value={email} onChange={(e) => setEmail(e.target.value)} />
//                     </Form.Item>
//                     <Button
//                         type="primary"
//                         htmlType="submit"
//                         loading={loading}
//                         disabled={loading}
//                         style={buttonStyle}
//                     >
//                         Send OTP
//                     </Button>
//                 </Form>
//             ) : (
//                 <Form onFinish={handleResetPassword}>
//                     <Form.Item
//                         label="OTP"
//                         name="otp"
//                         rules={[{ required: true, message: 'Please enter the OTP sent to your email' }]}
//                     >
//                         <Input value={otp} onChange={(e) => setOtp(e.target.value)} />
//                     </Form.Item>
//                     <Form.Item
//                         label="New Password"
//                         name="newPassword"
//                         rules={[{ required: true, message: 'Please enter your new password' }]}
//                     >
//                         <Input.Password value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
//                     </Form.Item>
//                     <Form.Item
//                         label="Confirm Password"
//                         name="confirmPassword"
//                         rules={[{ required: true, message: 'Please confirm your new password' }]}
//                     >
//                         <Input.Password value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
//                     </Form.Item>
//                     <Button
//                         type="primary"
//                         htmlType="submit"
//                         loading={loading}
//                         disabled={loading}
//                         style={buttonStyle}
//                     >
//                         Reset Password
//                     </Button>
//                 </Form>
//             )}
//         </Modal>
//     );
// };

// export default ForgotPasswordModal;




// above code is working code and below is not working getting error Error
// An error occurred while sending the OTP. Please check the email address or try again later.



// nice , now its working let sepereate the entering otp modal and new and confirm password for better UI/UX 


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

import { Button } from "../components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

// --- Validation Schemas ---

const EmailSchema = z.object({
    email: z.string().min(1, { message: "Email address is required." }).email({
        message: "Please enter a valid email address.",
    }),
});
type EmailFormValues = z.infer<typeof EmailSchema>;

const ResetPasswordSchema = z.object({
    otp: z.string().min(1, { message: "OTP is required." }),
    newPassword: z.string().min(6, { message: "Password must be at least 6 characters long." }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});
type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>;

// --- Component Props ---
interface ForgotPasswordModalProps {
    visible: boolean;
    onClose: () => void;
}

// --- Component ---
const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ visible, onClose }) => {
    const [step, setStep] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [apiSuccess, setApiSuccess] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

    // Use environment variable directly
    const baseUrl = import.meta.env.VITE_REACT_APP_URL;

    // Log warning if baseUrl is not set
    if (!baseUrl) {
        console.warn("VITE_REACT_APP_URL is not defined in .env. API requests will fail.");
    }

    // Form Hooks
    const emailForm = useForm<EmailFormValues>({
        resolver: zodResolver(EmailSchema),
        defaultValues: { email: "" },
        mode: 'onChange',
    });

    const resetForm = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(ResetPasswordSchema),
        defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
        mode: 'onChange',
    });

    // Reset state when modal closes
    useEffect(() => {
        if (!visible) {
            const timer = setTimeout(() => {
                emailForm.reset();
                resetForm.reset();
                setStep(1);
                setLoading(false);
                setApiError(null);
                setApiSuccess(null);
                setUserEmail('');
                setShowPassword(false);
                setShowConfirmPassword(false);
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setApiError(null);
            setApiSuccess(null);
        }
    }, [visible, emailForm, resetForm]);

    // --- Handlers ---

    const handleEmailSubmit = async (values: EmailFormValues) => {
        if (!baseUrl) {
            setApiError("API URL is not configured. Please contact support.");
            return;
        }

        setLoading(true);
        setApiError(null);
        setApiSuccess(null);

        try {
            const response = await axios.post(`${baseUrl}/api/v1/auth/forgotPassword`, {
                email: values.email,
            });

            if (response.data.success) {
                setUserEmail(values.email);
                setApiSuccess('OTP sent successfully. Please check your email.');
                setStep(2);
                resetForm.reset();
            } else {
                setApiError(response.data.message || 'Failed to send OTP. Please try again.');
            }
        } catch (error: any) {
            console.error("Forgot Password Error:", error);
            setApiError(
                error.response?.data?.message ||
                'An error occurred while sending the OTP. Please check the email address or try again later.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (values: ResetPasswordFormValues) => {
        if (!baseUrl) {
            setApiError("API URL is not configured. Please contact support.");
            return;
        }

        setLoading(true);
        setApiError(null);
        setApiSuccess(null);

        try {
            const response = await axios.post(`${baseUrl}/api/v1/auth/resetPassword`, {
                email: userEmail,
                otp: values.otp,
                newPassword: values.newPassword,
            });

            if (response.data.success) {
                setApiSuccess('Password reset successfully!');
                setTimeout(() => {
                    if (visible) {
                        onClose();
                    }
                }, 2000);
            } else {
                setApiError(response.data.message || 'Failed to reset password. Please check the OTP or try again.');
            }
        } catch (error: any) {
            console.error("Reset Password Error:", error);
            setApiError(
                error.response?.data?.message ||
                'An error occurred during password reset. Please check the OTP or try again later.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen && !loading) {
            onClose();
        }
    };

    return (
        <Dialog open={visible} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
                if (loading) e.preventDefault();
            }}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {step === 1 ? 'Forgot Password' : 'Reset Password'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1
                            ? "Enter your email address to receive a password reset code."
                            : `Enter the OTP sent to ${userEmail} and your new password.`}
                    </DialogDescription>
                </DialogHeader>

                {apiError && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{apiError}</AlertDescription>
                    </Alert>
                )}

                {apiSuccess && (
                    <Alert variant="success" className="mt-4">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>{step === 1 ? 'OTP Sent' : 'Success'}</AlertTitle>
                        <AlertDescription>{apiSuccess}</AlertDescription>
                    </Alert>
                )}

                {step === 1 && (
                    <Form {...emailForm}>
                        <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-6 pt-4">
                            <FormField
                                control={emailForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="you@example.com"
                                                {...field}
                                                disabled={loading}
                                                type="email"
                                                autoComplete="email"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={loading || !baseUrl}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send OTP
                            </Button>
                        </form>
                    </Form>
                )}

                {step === 2 && (
                    <Form {...resetForm}>
                        <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4 pt-4">
                            <FormField
                                control={resetForm.control}
                                name="otp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>OTP Code</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter OTP"
                                                {...field}
                                                disabled={loading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={resetForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Enter new password"
                                                    {...field}
                                                    disabled={loading}
                                                    autoComplete="new-password"
                                                    className="pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    disabled={loading}
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={resetForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm New Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Confirm new password"
                                                    {...field}
                                                    disabled={loading}
                                                    autoComplete="new-password"
                                                    className="pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    disabled={loading}
                                                    aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={loading || !baseUrl}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Reset Password
                            </Button>
                            <Button
                                type="button"
                                variant="link"
                                onClick={() => {
                                    if (!loading) {
                                        setStep(1);
                                        setApiError(null);
                                        setApiSuccess(null);
                                        resetForm.reset();
                                    }
                                }}
                                disabled={loading}
                                className="p-0 h-auto text-sm w-full justify-start"
                            >
                                Go back to enter email
                            </Button>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ForgotPasswordModal;