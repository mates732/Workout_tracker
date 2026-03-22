import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { healthCheck } from "../api/client";

export default function HomeScreen(): React.JSX.Element {
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    healthCheck().then((ok) => setServerStatus(ok ? "online" : "offline"));
  }, []);

  const statusColor =
    serverStatus === "online"
      ? styles.statusOnline
      : serverStatus === "offline"
      ? styles.statusOffline
      : undefined;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout Tracker</Text>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Server: </Text>
        {serverStatus === "checking" ? (
          <ActivityIndicator size="small" />
        ) : (
          <Text style={[styles.statusValue, statusColor]}>{serverStatus}</Text>
        )}
      </View>
      {serverStatus === "offline" && (
        <Text style={styles.hint}>
          {"Can't reach the server.\n" +
            "Make sure the backend is running and set\n" +
            "EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:8000\n" +
            "before starting Expo (see mobile/README.md)."}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
    color: "#1a1a2e",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    color: "#555",
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusOnline: {
    color: "#2e7d32",
  },
  statusOffline: {
    color: "#c62828",
  },
  hint: {
    marginTop: 12,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
  },
});
