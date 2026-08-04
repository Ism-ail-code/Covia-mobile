import { Component, type ReactNode } from "react";
import { View } from "react-native";
import { colors } from "@/theme";
import { AppText } from "./AppText";
import { Button } from "./Button";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error.message, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.background }}>
          <AppText size="lg" weight={700} style={{ marginBottom: 8 }}>
            Something went wrong
          </AppText>
          <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center", marginBottom: 16 }}>
            {this.state.error?.message ?? "An unexpected error occurred."}
          </AppText>
          <Button variant="outline" onPress={this.reset}>
            <AppText size="sm" weight={600} color={colors.primary}>Try again</AppText>
          </Button>
        </View>
      );
    }
    return this.props.children;
  }
}
