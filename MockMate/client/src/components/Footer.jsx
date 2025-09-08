import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="glass-card border-t border-white/20 backdrop-blur-md mt-12 text-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                <span className="text-xl font-bold"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
  <path fillRule="evenodd" d="M17.303 5.197A7.5 7.5 0 0 0 6.697 15.803a.75.75 0 0 1-1.061 1.061A9 9 0 1 1 21 10.5a.75.75 0 0 1-1.5 0c0-1.92-.732-3.839-2.197-5.303Zm-2.121 2.121a4.5 4.5 0 0 0-6.364 6.364.75.75 0 1 1-1.06 1.06A6 6 0 1 1 18 10.5a.75.75 0 0 1-1.5 0c0-1.153-.44-2.303-1.318-3.182Zm-3.634 1.314a.75.75 0 0 1 .82.311l5.228 7.917a.75.75 0 0 1-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 0 1-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 0 1-1.247-.606l.569-9.47a.75.75 0 0 1 .554-.68Z" clipRule="evenodd" />
</svg></span>
              </span>
              <span className="text-xl font-bold gradient-text">MockMate</span>
            </Link>
            <p className="text-sm text-black max-w-md">
              AI-powered interview preparation platform helping job seekers land roles with personalized practice and feedback.
            </p>
            <div className="flex gap-2 text-black">
              <a href="#" className="hover:text-purple-600 transition-colors">Twitter</a>
              <a href="#" className="hover:text-purple-600 transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-purple-600 transition-colors">GitHub</a>
              <a href="#" className="hover:text-purple-600 transition-colors">Email</a>
            </div>
          </div>

          {[
            { title: 'Product', links: [{n:'Features',h:'#features'},{n:'Pricing',h:'#pricing'},{n:'Demo',h:'/demo'},{n:'FAQ',h:'#faq'}]},
            { title: 'Company', links: [{n:'About',h:'/about'},{n:'Blog',h:'/blog'},{n:'Careers',h:'/careers'},{n:'Contact',h:'/contact'}]},
            { title: 'Resources', links: [{n:'Documentation',h:'/docs'},{n:'Help Center',h:'/help'},{n:'Community',h:'/community'},{n:'Status',h:'/status'}]},
            { title: 'Legal', links: [{n:'Privacy Policy',h:'/privacy'},{n:'Terms of Service',h:'/terms'},{n:'Cookie Policy',h:'/cookies'},{n:'GDPR',h:'/gdpr'}]},
          ].map((s, i) => (
            <div key={i} className="space-y-3">
              <h3 className="text-sm font-semibold">{s.title}</h3>
              <ul className="space-y-2">
                {s.links.map((l, j) => (
                  <li key={j}><Link to={l.h} className="text-sm text-black hover:text-purple-600 transition-colors">{l.n}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© {new Date().getFullYear()} MockMate. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


