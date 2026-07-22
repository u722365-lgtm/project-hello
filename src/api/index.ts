import { detectRuntimePlatform } from "@/lib/tauri/runtimePlatform";

export async function auth() {
  if (detectRuntimePlatform() === 'tauri') {
    const { auth } = await import('./auth');
    return auth();
  }
  return (await import('./auth')).auth();
}

export async function chat() {
  if (detectRuntimePlatform() === 'tauri') {
    const { chat } = await import('./chat');
    return chat();
  }
  return (await import('./chat')).chat();
}

export async function server() {
  if (detectRuntimePlatform() === 'tauri') {
    const { server } = await import('./server');
    return server();
  }
  return (await import('./server')).server();
}

export async function tools() {
  if (detectRuntimePlatform() === 'tauri') {
    const { tools } = await import('./tools');
    return tools();
  }
  return (await import('./tools')).tools();
}
