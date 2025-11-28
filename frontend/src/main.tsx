import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AuthGuard from 'components/AuthGuard';
import App from 'layouts/index';
import store from 'modules/store';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import queryClient from 'services/queryClient';

import 'tdesign-react/es/style/index.css';

import './styles/index.less';

const env = import.meta.env.MODE || 'development';
const baseRouterName = env === 'site' ? '/starter/react/' : '';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = document.getElementById('app')!;

const renderApp = () => {
  ReactDOM.createRoot(root).render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <HashRouter basename={baseRouterName}>
          <AuthGuard publicPaths={['/login', '/login/index']}>
            <App />
          </AuthGuard>
        </HashRouter>
        {env === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </Provider>,
  );
};

renderApp();
