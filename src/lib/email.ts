import emailjs from 'emailjs-com';

export interface EmailData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

// EmailJS service configuration
// Note: These values would normally be in environment variables
const SERVICE_ID = 'service_githxqz'; // Replace with your actual EmailJS Gmail service ID
const TEMPLATE_ID = 'template_8k4oy4k'; // Replace with your actual EmailJS template ID
const USER_ID = 'lmEPpNp8SVB0VZFZk'; // Replace with your actual EmailJS public key

export const sendEmail = async (data: EmailData): Promise<{ success: boolean; message: string }> => {
  
  try {
    // Prepare template parameters based on your template structure
    const templateParams = {
      to_name: 'John', // Your name as the recipient
      from_name: data.name,
      from_email: data.email,
      message: data.message,
      subject: data.subject || 'New contact form submission',
    };

    // Send email using EmailJS
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      USER_ID
    );

    console.log('Email sent successfully:', response);
    
    return {
      success: true,
      message: 'Email sent successfully! We will get back to you soon.',
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    
    return {
      success: false,
      message: 'Failed to send email. Please try again later.',
    };
  }
};
