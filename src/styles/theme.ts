import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "system",
  useSystemColorMode: true,
};

export const theme = extendTheme({
  config,
  styles: {
    global: (props: { colorMode: string }) => ({
      body: {
        bg: props.colorMode === "dark" ? "gray.900" : "gray.50",
      },
    }),
  },
  colors: {
    brand: {
      50: "#E6F2FF",
      100: "#B3D9FF",
      200: "#80BFFF",
      300: "#4DA6FF",
      400: "#1A8CFF",
      500: "#0073E6",
      600: "#005BB3",
      700: "#004280",
      800: "#002A4D",
      900: "#00111A",
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: "blue",
      },
    },
  },
});
