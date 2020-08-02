import { Link } from 'preact-router/match';
import style from './header.module.css';

const Header = () => (
  <header class={style.header}>
    <Link class={style.header__logo} href="/">
      simplemickey.com
    </Link>
    <nav class={style.header__menu}>
      <Link activeClassName={style.active} href="/blogs">
        Blogs
      </Link>
      <Link activeClassName={style.active} href="/contact">
        Contact me
      </Link>
    </nav>
  </header>
);

export default Header;
