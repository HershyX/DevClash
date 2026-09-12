import { useState, FormEvent } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@components/ui/Card';
import { cn, getInitials } from '@utils';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@context/ToastContext';
import { motion } from 'framer-motion';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const role = email.includes('teacher') ? 'teacher' : email.includes('personal') ? 'personal' : 'student';
      showToast({ type: 'success', title: 'Welcome back!', message: 'You have been logged in.' });
      navigate(`/${role}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      showToast({ type: 'error', title: 'Login failed', message: err instanceof Error ? err.message : 'Please check your credentials' });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'student' | 'teacher' | 'personal') => {
    setLoading(true);
    try {
      await demoLogin(role);
      showToast({ type: 'success', title: 'Demo login successful', message: `Logged in as ${role}` });
      const redirectPath = role === 'teacher' ? '/teacher' : `/${role}`;
      navigate(redirectPath, { replace: true });
    } catch (err) {
      showToast({ type: 'error', title: 'Demo login failed', message: err instanceof Error ? err.message : 'Try again' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <motion.div 
        className="absolute top-20 left-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-20 right-20 w-80 h-80 bg-adaptive-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <NavLink to="/" className="inline-flex items-center gap-2 mb-6">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-white font-bold text-2xl">DC</span>
            </motion.div>
            <span className="font-semibold text-2xl text-surface-900 dark:text-white">DevClash</span>
          </NavLink>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-surface-600 dark:text-surface-400">Sign in to continue your coding journey</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card variant="elevated" padding="lg">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>

            {error && (
              <motion.div 
                className="mb-4 p-3 rounded-lg bg-duel-50 dark:bg-duel-900/20 border border-duel-200 dark:border-duel-800 text-duel-700 dark:text-duel-300 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <label htmlFor="email" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  placeholder="you@devclash.demo"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <label htmlFor="password" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <Button type="submit" fullWidth loading={loading} size="lg">
                  Sign In
                </Button>
              </motion.div>
            </form>

            <CardFooter className="pt-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-200 dark:border-surface-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-surface-900 text-surface-500 dark:text-surface-400">
                    Or continue with demo
                  </span>
                </div>
              </div>

              <div className="space-y-2" role="group" aria-label="Demo login options">
                {[
                  { role: 'student', icon: '👨‍🎓', label: 'Student Demo' },
                  { role: 'teacher', icon: '👨‍🏫', label: 'Teacher Demo' },
                  { role: 'personal', icon: '👤', label: 'Personal Demo' },
                ].map((demo, index) => (
                  <motion.div
                    key={demo.role}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      fullWidth
                      leftIcon={<span className="w-5 h-5 flex items-center justify-center">{demo.icon}</span>}
                      onClick={() => handleDemoLogin(demo.role as any)}
                      disabled={loading}
                    >
                      {demo.label}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div 
          className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <p>Demo accounts use mock data. No real authentication.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}