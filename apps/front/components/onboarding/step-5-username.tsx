"use client";

import { useState, useEffect } from "react";
import { Check, AlertCircle } from "lucide-react";

interface Step5Props {
  username: string | undefined;
  onUsernameChange: (username: string) => void;
}

export function Step5Username({ username, onUsernameChange }: Step5Props) {
  const [status, setStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  // Validate username format: only lowercase letters, numbers, and hyphens
  const isValidFormat = (str: string) => /^[a-z0-9-]{3,}$/.test(str);

  useEffect(() => {
    if (!username || username.length < 3) {
      setStatus("idle");
      return;
    }

    // Check format validity
    if (!isValidFormat(username)) {
      setStatus("invalid");
      return;
    }

    // Simulate checking availability
    setStatus("checking");
    const timer = setTimeout(() => {
      // Mock: check if username is taken
      const takenUsernames = [
        "admin",
        "bluecollar",
        "worker",
        "test",
        "root",
        "api",
        "support",
        "contact",
      ];
      setStatus(
        takenUsernames.includes(username.toLowerCase()) ? "taken" : "available",
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [username]);

  return (
    <div className="flex flex-col h-full">
      {/* Title & Subtitle */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {
            "\uB098\uB9CC\uC758 \uAE30\uC220 \uBA85\uD568 \uC8FC\uC18C\uB97C \uC815\uD574\uC8FC\uC138\uC694."
          }
        </h1>
        <p className="text-base text-muted-foreground">
          {
            "\uC8FC\uC18C\uB294 \uAC00\uC785 \uD6C4 \uBCC0\uACBD\uC774 \uBD88\uAC00\uB2A5\uD569\uB2C8\uB2E4."
          }
        </p>
      </div>

      {/* Username Input */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-4">
          {/* URL Preview */}
          <div className="bg-secondary rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-2">
              {"\uAC1C\uC778 \uD504\uB85C\uD544 \uC8FC\uC18C"}
            </p>
            <p className="text-lg font-semibold text-foreground break-words">
              <span className="text-primary">{username || "_"}</span>
              <span className="text-muted-foreground">.worker.cv</span>
            </p>
          </div>

          {/* Input Field */}
          <div>
            <label
              htmlFor="username-input"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              영문 소문자, 숫자, 하이픈(-)만 사용 가능
            </label>
            <input
              id="username-input"
              type="text"
              value={username || ""}
              onChange={(e) => {
                const value = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "");
                onUsernameChange(value);
              }}
              placeholder="yourname"
              className={`w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none text-lg bg-card text-foreground ${
                status === "available"
                  ? "border-primary/50 focus:border-primary"
                  : status === "taken"
                    ? "border-destructive/50 focus:border-destructive"
                    : "border-border focus:border-primary"
              }`}
            />
          </div>

          {/* Status Message */}
          {status !== "idle" && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl ${
                status === "available"
                  ? "bg-green-50 border border-green-300"
                  : status === "taken"
                    ? "bg-red-50 border border-red-300"
                    : "bg-secondary border border-border"
              }`}
            >
              {status === "checking" && (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    {"\uD655\uC778 \uC911..."}
                  </p>
                </>
              )}
              {status === "available" && (
                <>
                  <Check size={18} className="text-primary flex-shrink-0" />
                  <p className="text-sm text-primary">
                    사용 가능한 주소입니다!
                  </p>
                </>
              )}
              {status === "taken" && (
                <>
                  <AlertCircle
                    size={18}
                    className="text-destructive flex-shrink-0"
                  />
                  <p className="text-sm text-destructive">
                    {
                      "\uc774\ubbf8 \uc0ac\uc6a9\uc911\uc778 \uc8fc\uc18c\uc785\ub2c8\ub2e4."
                    }
                  </p>
                </>
              )}
              {status === "invalid" && (
                <>
                  <AlertCircle
                    size={18}
                    className="text-orange-600 flex-shrink-0"
                  />
                  <p className="text-sm text-orange-700">
                    영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-secondary rounded-xl p-4 border border-border flex items-start gap-2.5">
            <AlertCircle
              size={14}
              className="text-muted-foreground flex-shrink-0 mt-0.5"
            />
            <p className="text-xs text-muted-foreground">
              <strong>{"\uC911\uc694:"}</strong>{" "}
              {
                "\uC8FC\uC18C\uB294 \uAC00\uC785 \uD6C4 \uBCC0\uACBD\uC774 \uBD88\uAC00\uB2A5\uD569\uB2C8\uB2E4. \uC2E0\uC911\uD558\uAC8C \uC120\uD0DD\uD574\uC8FC\uC138\uC694."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
