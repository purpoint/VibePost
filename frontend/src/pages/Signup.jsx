import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout/AuthLayout.jsx';
import FormField from '../components/FormField/FormField.jsx';
import Button from '../components/Button/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  validateSignupForm,
  mapServerErrorToField,
  PASSWORD_MIN_LENGTH,
} from '../utils/validators.js';
import styles from './AuthForm.module.css';

const EMPTY_FORM = { name: '', username: '', email: '', password: '' };

export default function Signup() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  };

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateSignupForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setFormError('');
    try {
      await signup({
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/feed', { replace: true });
    } catch (error) {
      // Point at the offending field when the server names one.
      const fieldError = mapServerErrorToField(error.message);
      if (fieldError) setErrors(fieldError);
      else setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join VibePost and start posting in seconds."
      footer={
        <>
          Already have an account? <Link to="/login">Login</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}

        <fieldset className={styles.fields} disabled={submitting}>
          <FormField
            label="Name"
            name="name"
            autoComplete="name"
            placeholder="Manan Patel"
            value={form.name}
            onChange={updateField('name')}
            error={errors.name}
          />

          <FormField
            label="Username"
            name="username"
            autoComplete="username"
            placeholder="manan"
            value={form.username}
            onChange={updateField('username')}
            error={errors.username}
            hint="Letters, numbers and underscores only"
          />

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
            autoComplete="new-password"
            placeholder="Choose a password"
            value={form.password}
            onChange={updateField('password')}
            error={errors.password}
            hint={`At least ${PASSWORD_MIN_LENGTH} characters`}
          />
        </fieldset>

        <Button type="submit" fullWidth loading={submitting}>
          {submitting ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
