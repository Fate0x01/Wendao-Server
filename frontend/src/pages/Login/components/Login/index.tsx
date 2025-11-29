import { useMutation, useQueryClient } from '@tanstack/react-query';
import classnames from 'classnames';
import { type LoginFeatureConfig } from 'configs/login';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserPermissions, fetchUserProfile, loginWithPassword, type LoginDto } from 'services/auth';
import { useAuthActions } from 'stores/auth';
import { BrowseIcon, BrowseOffIcon, LockOnIcon, RefreshIcon, UserIcon } from 'tdesign-icons-react';
import {
  Button,
  Checkbox,
  Form,
  Input,
  MessagePlugin,
  QRCode,
  type FormInstanceFunctions,
  type SubmitContext,
} from 'tdesign-react';
import useCountdown from '../../hooks/useCountDown';

import Style from './index.module.less';

const { FormItem } = Form;

export type ELoginType = 'password' | 'phone' | 'qrcode';

interface LoginProps {
  loginConfig: LoginFeatureConfig;
}

export default function Login({ loginConfig }: LoginProps) {
  const { enableForgotAccount, enablePhoneLogin, enableQrLogin } = loginConfig;
  const [loginType, changeLoginType] = useState<ELoginType>('password');
  const [showPsw, toggleShowPsw] = useState(false);
  const { countdown, setupCountdown } = useCountdown(60);
  const formRef = useRef<FormInstanceFunctions>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authActions = useAuthActions();
  const hasLoginSwitch = enableQrLogin || enablePhoneLogin;

  const loginMutation = useMutation({
    mutationFn: loginWithPassword,
    onSuccess: async (tokens) => {
      authActions.setTokens(tokens);
      try {
        const [profile, accessPayload] = await Promise.all([fetchUserProfile(), fetchUserPermissions()]);
        authActions.setUserProfile(profile);
        authActions.setAccessControl(accessPayload);
        await queryClient.invalidateQueries({ queryKey: ['auth'] });
      } catch (error: any) {
        authActions.reset();
        MessagePlugin.error(error?.msg || '获取用户信息失败');
        return;
      }
      MessagePlugin.success('登录成功');
      navigate('/dashboard/base');
    },
    onError: (error: any) => {
      MessagePlugin.error(error?.msg || '登录失败');
    },
  });

  const onSubmit = async (e: SubmitContext) => {
    if (e.validateResult === true) {
      const formValue = formRef.current?.getFieldsValue?.(true) || {};
      loginMutation.mutate(formValue as LoginDto);
    }
  };

  const switchType = (val: ELoginType) => {
    if (val === 'qrcode' && !enableQrLogin) return;
    if (val === 'phone' && !enablePhoneLogin) return;
    formRef.current?.reset?.();
    changeLoginType(val);
  };

  const handleDevLogin = (type: 'admin' | 'leader' | 'groupMember') => {
    let credentials;
    switch (type) {
      case 'admin':
        credentials = { username: 'admin', password: 'admin123' };
        break;
      case 'leader':
        credentials = { username: '刘德华', password: 'a123456' };
        break;
      case 'groupMember':
        credentials = { username: '一组成员', password: 'a123456' };
        break;
      default:
        credentials = {};
    }
    formRef.current?.setFieldsValue?.(credentials);
    loginMutation.mutate(credentials as LoginDto);
  };

  return (
    <div>
      <Form
        ref={formRef}
        className={classnames(Style.itemContainer, `login-${loginType}`)}
        labelWidth={0}
        onSubmit={onSubmit}
      >
        {loginType === 'password' && (
          <>
            {/* 开发环境快捷登录通道 */}
            {import.meta.env?.MODE === 'development' && (
              <div className='mb-4 p-3 rounded-md border border-dashed border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'>
                <div className='mb-2 text-xs text-gray-500'>开发环境快捷入口</div>
                <div className='flex gap-2 flex-wrap'>
                  <Button block variant='outline' size='small' onClick={() => handleDevLogin('admin')}>
                    Admin
                  </Button>
                  <Button block variant='outline' size='small' onClick={() => handleDevLogin('leader')}>
                    负责人（刘德华）
                  </Button>
                  <Button block variant='outline' size='small' onClick={() => handleDevLogin('groupMember')}>
                    组员（一组成员）
                  </Button>
                </div>
              </div>
            )}
            <FormItem name='username' rules={[{ required: true, message: '账号必填', type: 'error' }]}>
              <Input size='large' placeholder='请输入账号' prefixIcon={<UserIcon />}></Input>
            </FormItem>
            <FormItem name='password' rules={[{ required: true, message: '密码必填', type: 'error' }]}>
              <Input
                size='large'
                type={showPsw ? 'text' : 'password'}
                clearable
                placeholder='请输入登录密码'
                prefixIcon={<LockOnIcon />}
                suffixIcon={
                  showPsw ? (
                    <BrowseIcon onClick={() => toggleShowPsw((current) => !current)} />
                  ) : (
                    <BrowseOffIcon onClick={() => toggleShowPsw((current) => !current)} />
                  )
                }
              />
            </FormItem>
            <div className={classnames(Style.checkContainer, Style.rememberPwd)}>
              <Checkbox>记住账号</Checkbox>
              {enableForgotAccount && <span className={Style.checkContainerTip}>忘记账号？</span>}
            </div>
          </>
        )}

        {/* 扫码登陆 */}
        {loginType === 'qrcode' && enableQrLogin && (
          <>
            <div className={Style.tipContainer}>
              <span className='tip'>请使用微信扫一扫登录</span>
              <span className='refresh'>
                刷新 <RefreshIcon />
              </span>
            </div>
            <QRCode value='https://tdesign.tencent.com/' size={200} />
          </>
        )}
        {/* // 手机号登陆 */}
        {loginType === 'phone' && enablePhoneLogin && (
          <>
            <FormItem name='phone' rules={[{ required: true, message: '手机号必填', type: 'error' }]}>
              <Input maxlength={11} size='large' placeholder='请输入您的手机号' prefixIcon={<UserIcon />} />
            </FormItem>
            <FormItem name='verifyCode' rules={[{ required: true, message: '验证码必填', type: 'error' }]}>
              <Input size='large' placeholder='请输入验证码' />
              <Button
                variant='outline'
                className={Style.verificationBtn}
                disabled={countdown > 0}
                onClick={setupCountdown}
              >
                {countdown === 0 ? '发送验证码' : `${countdown}秒后可重发`}
              </Button>
            </FormItem>
          </>
        )}
        {loginType !== 'qrcode' && (
          <FormItem className={Style.btnContainer}>
            <Button block size='large' type='submit'>
              登录
            </Button>
          </FormItem>
        )}

        {hasLoginSwitch && (
          <div className={Style.switchContainer}>
            {loginType !== 'password' && (
              <span className='tip' onClick={() => switchType('password')}>
                使用账号密码登录
              </span>
            )}
            {enableQrLogin && loginType !== 'qrcode' && (
              <span className='tip' onClick={() => switchType('qrcode')}>
                使用微信扫码登录
              </span>
            )}
            {enablePhoneLogin && loginType !== 'phone' && (
              <span className='tip' onClick={() => switchType('phone')}>
                使用手机号登录
              </span>
            )}
          </div>
        )}
      </Form>
    </div>
  );
}
