
import './style.css';
import AuthScreen from './auth-screen';

export const metadata = {
  title: 'CareerTrack',
  description: 'Internship and job application tracker'
};
  
export default function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthScreen>{children}</AuthScreen>
      </body>
    </html>
  );
}
