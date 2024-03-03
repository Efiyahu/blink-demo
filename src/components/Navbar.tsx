import { useTranslation } from 'react-i18next';
import KlipsLogo from '../assets/klips-ligh-desktop.svg';

const Navbar = () => {
  const { t } = useTranslation();
  return (
    <div className="navbar">
      <img className="logo" src={KlipsLogo} alt="klips-logo" />
      <h1 className="title">{t('paymentVerification')}</h1>
    </div>
  );
};

export default Navbar;
