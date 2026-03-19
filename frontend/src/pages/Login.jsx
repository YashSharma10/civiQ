import { SignIn } from '@clerk/clerk-react';

export default function Login() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gray-50">
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-secondary/10 rounded-full blur-3xl z-0" />
      
      <div className="relative z-10 w-full flex justify-center">
        <SignIn routing="path" path="/login" signUpUrl="/register" />
      </div>
    </div>
  );
}
