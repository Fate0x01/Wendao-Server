import classNames from 'classnames';
import { loginFeatureConfig } from 'configs/login';
import { selectGlobal } from 'modules/global';
import { useAppSelector } from 'modules/store';
import { memo, useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';

import Style from './index.module.less';

export default memo(() => {
  const [type, setType] = useState<'login' | 'register'>('login');
  const globalState = useAppSelector(selectGlobal);
  const { theme } = globalState;
  const { enableRegister } = loginFeatureConfig;
  const isRegister = enableRegister && type === 'register';

  const handleSwitchLoginType = () => {
    if (!enableRegister) return;
    setType(isRegister ? 'login' : 'register');
  };

  return (
    <div
      className={classNames(Style.loginWrapper, { [Style.light]: theme === 'light', [Style.dark]: theme !== 'light' })}
    >
      {/* <LoginHeader /> */}
      <div className={Style.loginContainer}>
        <div className={Style.titleContainer}>
          <h1 className={Style.title}>登录到</h1>
          <h1 className={Style.title}>TDesign Starter</h1>
          {enableRegister && (
            <div className={Style.subTitle}>
              <p className={classNames(Style.tip, Style.registerTip)}>{isRegister ? '已有账号?' : '没有账号吗?'}</p>
              <p className={classNames(Style.tip, Style.loginTip)} onClick={handleSwitchLoginType}>
                {isRegister ? '登录' : '注册新账号'}
              </p>
            </div>
          )}
        </div>
        {isRegister ? <Register /> : <Login loginConfig={loginFeatureConfig} />}
      </div>
      <footer className={Style.copyright}>
        Copyright @ 2021-{new Date().getFullYear()} Tencent. All Rights Reserved
      </footer>
    </div>
  );
});
