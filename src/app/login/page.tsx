import LoginForm from "@/components/login/loginForm";

export default function LoginPage() {
  return (
    <>
      <div className="flex  items-center justify-center min-h-screen">
        <div className={`card w-[90%] md:w-1/2`}>
          <h1 className="admin-form-header">Войти</h1>
          <LoginForm />
        </div>
      </div>
    </>
  );
}
