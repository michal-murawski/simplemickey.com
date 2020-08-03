import { h } from 'preact';
import { useEffect } from 'preact/hooks';

const Home = () => {
  /**
   * Netlify CMS's accept invite link land on home page.
   * This redirection takes it to the right place(/admin).
   */

  useEffect(() => {
    if (window !== undefined && window.location.href.includes('#invite_token')) {
      const { href } = window.location;
      window.location.href = `${href.substring(0, href.indexOf('#'))}admin${href.substring(href.indexOf('#'))}`;
    }
  }, []);

  return <div>It is me</div>;
};

export default Home;
