import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";

export default function EmailVerify() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const msg = searchParams.get('msg');
  const navigate = useNavigate();

  let title = '';
  let description = '';

  useEffect(() => {
    if (status === 'success') {
      toast({
        title: "Email verified!",
        description: "Please login using your credentials."});
      navigate('/auth');
    }
  }, [status, navigate]);

  switch (status) {
    case 'expired':
      title = 'Link Expired';
      description = 'This verification link is invalid or has expired.';
      break;
    case 'error':
      title = 'Error';
      description = msg
        ? `An error occurred: ${msg}`
        : 'An unknown error occurred while activating your account.';
      break;
    default:
      title = 'Verification Pending';
      description = 'We are processing your request...';
      break;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-gray-700">{description}</p>
    </div>
  );
}
