import { defineConfig } from "@apps-in-toss/web-framework/config";

// 앱인토스 콘솔에 등록한 앱 이름과 같아야 업로드된다
export default defineConfig({
  appName: "drawpinball",
  brand: { primaryColor: "#2de2e6" },
  permissions: [],
  navigationBar: { withBackButton: true, withHomeButton: true, withTitle: true, theme: "dark" },
  webView: { bounces: false, pullToRefreshEnabled: false, overScrollMode: "never" },
  webBundleDir: "dist",
});
