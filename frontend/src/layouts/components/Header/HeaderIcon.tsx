import { toggleSetting } from 'modules/global';
import { useAppDispatch } from 'modules/store';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, PoweroffIcon, SettingIcon, UserCircleIcon } from 'tdesign-icons-react';
import { Button, Dropdown, Popup, Space } from 'tdesign-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthActions, useAuthStore } from 'stores/auth';
import Style from './HeaderIcon.module.less';

const { DropdownMenu, DropdownItem } = Dropdown;

export default memo(() => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authActions = useAuthActions();
  const username = useAuthStore((state) => state.userProfile?.username || '用户');

  const gotoWiki = () => {
    window.open('https://tdesign.tencent.com/react/overview');
  };

  const gotoGitHub = () => {
    window.open('https://github.com/Tencent/tdesign-react-starter');
  };

  const clickHandler = (data: any) => {
    if (data.value === 1) {
      navigate('/user/index');
    }
  };
  const handleLogout = async () => {
    authActions.reset();
    await queryClient.removeQueries({ queryKey: ['auth'] });
    navigate('/login');
  };

  return (
    <Space align='center'>
      {/*
      <Badge className={Style.badge} count={6} dot={false} maxCount={99} shape='circle' showZero={false} size='medium'>
        <Button className={Style.menuIcon} shape='square' size='large' variant='text' icon={<MailIcon />} />
      </Badge>
      <Popup content='代码仓库' placement='bottom' showArrow destroyOnClose>
        <Button
          className={Style.menuIcon}
          shape='square'
          size='large'
          variant='text'
          onClick={gotoGitHub}
          icon={<LogoGithubIcon />}
        />
      </Popup>
      <Popup content='帮助文档' placement='bottom' showArrow destroyOnClose>
        <Button
          className={Style.menuIcon}
          shape='square'
          size='large'
          variant='text'
          onClick={gotoWiki}
          icon={<HelpCircleIcon />}
        />
      </Popup>
      */}
      <Dropdown trigger={'click'} onClick={clickHandler}>
        <Button variant='text' className={Style.dropdown}>
          <Icon name='user-circle' className={Style.icon} />
          <span className={Style.text}>{username}</span>
          <Icon name='chevron-down' className={Style.icon} />
        </Button>
        <DropdownMenu>
          <DropdownItem value={1}>
            <div className={Style.dropItem}>
              <UserCircleIcon />
              <span>个人中心</span>
            </div>
          </DropdownItem>
          <DropdownItem value={1} onClick={handleLogout}>
            <div className={Style.dropItem}>
              <PoweroffIcon />
              <span>退出登录</span>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <Popup content='页面设置' placement='bottom' showArrow destroyOnClose>
        <Button
          className={Style.menuIcon}
          shape='square'
          size='large'
          variant='text'
          onClick={() => dispatch(toggleSetting())}
          icon={<SettingIcon />}
        />
      </Popup>
    </Space>
  );
});
