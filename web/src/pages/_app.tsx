import type { AppProps } from 'next/app';
import { ThemeProvider } from 'styled-components';

// Define your theme
const theme = {
  colors: {
    primary: '#0070f3',
    secondary: '#1e293b',
    accent: '#3b82f6',
    background: '#ffffff',
    text: '#1e293b',
  },
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
