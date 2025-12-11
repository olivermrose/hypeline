import { createContext } from "svelte";

export interface SidebarContext {
	collapsed: boolean;
}

export const [getSidebarContext, setSidebarContext] = createContext<SidebarContext>();
