import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout/AuthLayout.jsx';
import FormField from '../components/FormField/FormField.jsx';
import Button from '../components/Button/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { validateLoginForm } from '../utils/validators.js';
import styles from './AuthForm.module.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Return the user to the page that sent them here, when there was one.
  const redirectTo = location.state?.from ?? '/feed';

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  };

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateLoginForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setFormError('');
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to share what you're up to."
      footer={
        <>
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}

        <FormField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={updateField('email')}
          error={errors.email}
        />

        <FormField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={updateField('password')}
          error={errors.password}
        />

        <Button type="submit" fullWidth loading={submitting}>
          {submitting ? 'Logging in…' : 'Login'}
        </Button>
      </form>
    </AuthLayout>
  );
}
