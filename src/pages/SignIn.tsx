
import GithubAuth from "@/components/auth/GithubAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const SignIn = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/profile');
      }
    };
    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-8 text-github-gray">Sign in to Rastion</h1>
        <GithubAuth />
      </div>
    </div>
  );
};

export default SignIn;
