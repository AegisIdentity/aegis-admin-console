import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Result, Spin } from 'antd';
import { userManager } from './userManager';

/** Handles the OIDC redirect back from the authorization-server (exchanges the code for tokens). */
export function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userManager
      .signinRedirectCallback()
      .then(() => navigate('/', { replace: true }))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Sign-in failed'));
  }, [navigate]);

  if (error) {
    return <Result status="error" title="Sign-in failed" subTitle={error} />;
  }
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <Spin size="large" tip="Completing sign-in…" />
    </div>
  );
}
