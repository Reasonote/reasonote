import {
  AnimatePresence,
  motion,
} from "framer-motion";
import Link from "next/link";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useUserIsLoggedIn} from "@/clientOnly/hooks/useUserIsLoggedIn";
import {
  Button,
  Skeleton,
} from "@mui/material";

import AccountButton from "../AccountButton/AccountButton";

export default function LoginOrAccountButton() {
  const isMobile = useIsSmallDevice();
  const { data: isLoggedIn, loading: isLoggedInLoading, error: isLoggedInError } = useUserIsLoggedIn();

  return (
    <AnimatePresence mode="wait">
      {isLoggedInLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Skeleton width={80} height={60} />
        </motion.div>
      ) : isLoggedIn ? (
        <motion.div
          key="account"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <AccountButton />
        </motion.div>
      ) : (
        <motion.div
          key="login"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Link href="/app/login" style={{ textDecoration: "none" }}>
            <Button
              color="primary"
              variant={"contained"}
              size={isMobile ? "small" : "medium"} sx={{
                textTransform: 'none',
              }}
            >
              <b>Sign In</b>
            </Button>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
