import { NAV_LINKS } from "@/lib/data";
import { Sparkles, MapPin, Mail, Phone } from "lucide-react";
export function Footer() {
    return (<footer className="mt-20 border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-wonderlust-primary text-white">
                <Sparkles className="h-5 w-5"/>
              </div>
              <span className="text-lg font-bold text-slate-900">Wonderlust</span>
            </div>
            <p className="mt-3 text-sm text-slate-500 max-w-xs">
              Curated journeys that turn ordinary trips into something extraordinary.
              Your travel story starts here.
            </p>
            <div className="mt-4 flex gap-2">
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" aria-label="Instagram">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.01 4.85.07 3.252.148 4.771 1.691 4.919 4.919.06.066.166.07 4.85.07s4.79-.004 4.85-.07c.148-3.228 1.667-4.771 4.919-4.919.06-.06.07-.166.07-4.85 0-3.204 0-3.584-.01-4.85-.148-3.252-1.691-4.771-4.919-4.919-.06-.066-.166-.07-4.85-.07s-4.79.004-4.85.07c-.148 3.228-1.667 4.771-4.919 4.919-.06.066-.07.166-.07 4.85zM12 0C8.741 0 8.333.015 7.053.072 2.656.279 0 2.656 0 7.053 0 11.463 2.6 14.849 7.66 15.54c2.457.387 4.488 1.807 6.109 4.285 1.62.296 2.969 1.398 3.881 3.12.913 1.722.999 3.955.999 5.434 0 3.204 0 3.584-.01 4.85-.148 3.252-1.69 4.771-4.919 4.919-.06.06-.166.07-4.85.07s-4.79-.004-4.85-.07c-.148-3.228-1.668-4.771-4.92-4.919-.06-.066-.166-.07-4.85-.07s-4.79.004-4.85.07c-.148 3.228-1.668 4.771-4.92 4.919-.06.06-.07.166-.07 4.85 0 3.204 0 3.584.01 4.85.148 3.252 1.69 4.771 4.919 4.919.06.066.166.07 4.85.07s4.79-.004 4.85-.07c.148-3.228 1.668-4.771 4.919-4.919.06-.066.07-.166.07-4.85 0-.016-.001-.033-.002-.05z"/>
                </svg>
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" aria-label="Twitter">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" aria-label="YouTube">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.182c-.37-.09-.75-.001-1.066.216-.315.215-.52.572-.568.953l-1.477 5.907c-.042.168-.149.27-.326.27H7.84q-.188 0-.286-.112l-1.89-3.79c-.005-.012-.014-.02-.014-.03 0-.028.014-.05.041-.066.29-.177 1.259-.971 1.259-1.992V3.969c0-.666-.43-1.157-1.068-1.237a2.01 2.01 0 0 0-1.418-.596l-1.42-1.088v-2.229c0-.385.072-.753.213-1.086.141-.333.39-.58.7-.705.097-.01.23-.014.326-.014 1.034 0 1.856.608 2.231 1.637.324.836.579 1.874.729 2.611l.448 11.205c.053.134.171.226.306.226.003 0 .006 0 .009-.001l.005-.001c.036-.007.072-.014.108-.014.436 0 .79.29.896.689.092.524-.005 1.132-.273 1.559l-1.22 5.749c-.025.112-.076.178-.16.199l-1.037.206c-.205.04-.433.033-.625-.05-.19-.08-.4-.156-.613-.24L8.34 15.8c-.01-.01-.02-.022-.032-.031-.176-.168-.336-.365-.467-.588l-1.575-1.577a4.97 4.97 0 0 0-1.256-.647c.135-.04.273-.062.415-.07.094-.082.188-.165.284-.247.439-.275 1.1-.387 1.49-.387l.013 0 .012 0c.086 0 .172.006.256.018.68.006 1.278.365 1.713.577.458.356.686.976.686 1.662v.012c0 1.216-.481 2.225-1.009 2.726a4.97 4.97 0 0 0-.185.12l-3.12 2.637c-.048.04-.112.058-.164.06z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Explore</h3>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map((link) => (<li key={link.href}>
                  <a href={link.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                    {link.label}
                  </a>
                </li>))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Support</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  Safety &amp; Security
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  Cancellation Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Get in touch</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-500">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400"/>
                123 Travel Street
                <span className="ml-1 font-medium text-slate-700">New York, NY 10001</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400"/>
                <a href="mailto:hello@wonderlust.com" className="hover:text-slate-900 transition-colors">
                  hello@wonderlust.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400"/>
                <a href="tel:+12125550134" className="hover:text-slate-900 transition-colors">
                  +1 (212) 555-0134
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Wonderlust. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Terms
            </a>
            <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>);
}
