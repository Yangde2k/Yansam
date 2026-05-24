import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Heart, Sparkles } from 'lucide-react';
import { AuthFrame, AuthHero, Button, GhostButton, GlassCard, Input } from '../components';
import { useAuth } from '../context/AuthContext';
import { useUIStore } from '../store/ui';

export function LandingPage() {
  const { session } = useAuth();
  if (session) return <Navigate to="/app/home" replace />;

  return (
    <AuthFrame>
      <div className="space-y-5 pt-10">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-cocoa/60">Private for two</p>
          <h1 className="mt-4 font-serif text-5xl leading-tight text-wine">YANSAM</h1>
          <p className="mt-4 text-sm leading-7 text-cocoa/75">A calm cinematic sanctuary for two hearts in one shared long-distance home.</p>
        </div>
        <GlassCard className="relative overflow-hidden p-6">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose/20 blur-2xl" />
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/75 text-wine shadow-soft">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <p className="font-serif text-2xl text-wine">Shared diary, gallery, letters, moods, and future plans.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            <Link to="/signup"><Button className="w-full">Create your sanctuary</Button></Link>
            <Link to="/login"><GhostButton className="w-full">I already have a room</GhostButton></Link>
          </div>
        </GlassCard>
        <div className="grid grid-cols-2 gap-3">
          {[
            'Daily emotional check-ins',
            'Private hidden letters',
            'Fast, stable photo albums',
            'Anniversary and future plans',
          ].map((item) => (
            <GlassCard key={item} className="p-4">
              <Sparkles className="h-4 w-4 text-wine" />
              <p className="mt-3 text-sm text-cocoa/80">{item}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </AuthFrame>
  );
}

export function LoginPage() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const addToast = useUIStore((state) => state.addToast);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ email: string; password: string }>();

  if (session) return <Navigate to="/app/home" replace />;

  return (
    <AuthFrame>
      <AuthHero title="Welcome back" subtitle="Step back into your shared sanctuary." />
      <GlassCard>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            try {
              await signIn(values.email, values.password);
              addToast({ title: 'Welcome back to YANSAM', tone: 'success' });
              navigate('/app/home');
            } catch (error) {
              addToast({ title: 'Login failed', description: error instanceof Error ? error.message : 'Please try again.', tone: 'error' });
            }
          })}
        >
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Email</label>
            <Input type="email" placeholder="you@example.com" {...register('email', { required: true })} />
          </div>
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Password</label>
            <Input type="password" placeholder="••••••••" {...register('password', { required: true })} />
          </div>
          <Button className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Login'}</Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm text-cocoa/80">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/signup">Create account</Link>
        </div>
      </GlassCard>
    </AuthFrame>
  );
}

export function SignupPage() {
  const { session, signUp } = useAuth();
  const navigate = useNavigate();
  const addToast = useUIStore((state) => state.addToast);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ name: string; email: string; password: string }>();

  if (session) return <Navigate to="/app/home" replace />;

  return (
    <AuthFrame>
      <AuthHero title="Build your private home" subtitle="Create a secure space that can only ever belong to two people." />
      <GlassCard>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            try {
              await signUp(values.email, values.password, values.name);
              addToast({ title: 'Account created', description: 'Check your email if confirmation is enabled.', tone: 'success' });
              navigate('/login');
            } catch (error) {
              addToast({ title: 'Sign up failed', description: error instanceof Error ? error.message : 'Please try again.', tone: 'error' });
            }
          })}
        >
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Name</label>
            <Input placeholder="Your name" {...register('name', { required: true })} />
          </div>
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Email</label>
            <Input type="email" placeholder="you@example.com" {...register('email', { required: true })} />
          </div>
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Password</label>
            <Input type="password" placeholder="••••••••" {...register('password', { required: true, minLength: 8 })} />
          </div>
          <Button className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create account'}</Button>
        </form>
        <p className="mt-4 text-center text-sm text-cocoa/75">Already have a private space? <Link to="/login" className="text-wine">Login</Link></p>
      </GlassCard>
    </AuthFrame>
  );
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const addToast = useUIStore((state) => state.addToast);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ email: string }>();

  return (
    <AuthFrame>
      <AuthHero title="Reset your password" subtitle="We’ll send a gentle reset link to your email." />
      <GlassCard>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async ({ email }) => {
            try {
              await resetPassword(email);
              addToast({ title: 'Reset email sent', description: 'Check your inbox for the secure link.', tone: 'success' });
            } catch (error) {
              addToast({ title: 'Could not send reset email', description: error instanceof Error ? error.message : 'Please try again.', tone: 'error' });
            }
          })}
        >
          <div>
            <label className="mb-2 block text-sm text-cocoa/75">Email</label>
            <Input type="email" placeholder="you@example.com" {...register('email', { required: true })} />
          </div>
          <Button className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Send reset link'}</Button>
        </form>
        <p className="mt-4 text-center text-sm text-cocoa/75"><Link to="/login" className="text-wine">Back to login</Link></p>
      </GlassCard>
    </AuthFrame>
  );
}