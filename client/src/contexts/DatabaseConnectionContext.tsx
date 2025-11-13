// src/contexts/DatabaseConnectionContext.tsx
// Context để truyền database connection config xuống Dashboard

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { DatabaseConnection } from "../types";

interface DatabaseConnectionContextType {
  connection: (DatabaseConnection & { password?: string }) | null;
  setConnection: (connection: (DatabaseConnection & { password?: string }) | null) => void;
  disconnect: () => void;
}

const DatabaseConnectionContext = createContext<DatabaseConnectionContextType | undefined>(undefined);

export function DatabaseConnectionProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<(DatabaseConnection & { password?: string }) | null>(null);

  const disconnect = () => {
    setConnection(null);
  };

  return (
    <DatabaseConnectionContext.Provider value={{ connection, setConnection, disconnect }}>
      {children}
    </DatabaseConnectionContext.Provider>
  );
}

export function useDatabaseConnectionContext() {
  const context = useContext(DatabaseConnectionContext);
  if (context === undefined) {
    throw new Error("useDatabaseConnectionContext must be used within DatabaseConnectionProvider");
  }
  return context;
}

