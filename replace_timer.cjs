const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  // Auto-logout countdown logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (user && activeTab !== "dashboard" && activeTab !== "login") {
      timer = setInterval(() => {
        setSessionTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Handle auto logout
            setUser(null);
            localStorage.removeItem("sndm_user");
            setActiveTab("login");
            return 1200;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Reset timer when user is on dashboard or logged out
      setSessionTimeLeft(1200);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [user, activeTab]);`;

const replacementStr = `  // Auto-logout countdown logic & Unified 20-Min Inactivity & Background Logout Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Timer for active tab inactivity (when not on dashboard)
    if (user && activeTab !== "dashboard" && activeTab !== "login") {
      timer = setInterval(() => {
        setSessionTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Handle auto logout
            setUser(null);
            localStorage.removeItem("sndm_user");
            setActiveTab("login");
            return 1200;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Reset timer when user is on dashboard or logged out
      setSessionTimeLeft(1200);
    }

    // Visibility change logic for AppLifecycleState.paused / hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (user) {
          localStorage.setItem("lastExitTimestamp", Date.now().toString());
        }
      } else if (document.visibilityState === "visible") {
        const lastExitStr = localStorage.getItem("lastExitTimestamp");
        if (lastExitStr && user) {
          const lastExit = parseInt(lastExitStr, 10);
          const now = Date.now();
          const diffMs = now - lastExit;
          // 20 minutes = 1200000 milliseconds
          if (diffMs >= 1200000) {
            // Purge firebase session and auto logout
            setUser(null);
            localStorage.removeItem("sndm_user");
            localStorage.removeItem("lastExitTimestamp");
            setActiveTab("login");
            setSessionTimeLeft(1200);
          } else {
            // Reset timer automatically if returning within 20 mins
            localStorage.removeItem("lastExitTimestamp");
            setSessionTimeLeft(1200);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, activeTab]);`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Successfully replaced timer logic.");
} else {
  console.log("Target string not found. Please check manually.");
}
