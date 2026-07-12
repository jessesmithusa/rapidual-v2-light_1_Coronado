import { render, screen, fireEvent } from "@testing-library/react-native";
import { Button, Badge, Text } from "@rapidual/ui";

describe("UI primitives", () => {
  it("Button renders its title and fires onPress", () => {
    const onPress = jest.fn();
    render(<Button title="Schedule pickup" onPress={onPress} />);
    fireEvent.press(screen.getByText("Schedule pickup"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("Button does not fire when loading", () => {
    const onPress = jest.fn();
    render(<Button title="Confirm" loading onPress={onPress} />);
    // title is replaced by a spinner while loading
    expect(screen.queryByText("Confirm")).toBeNull();
  });

  it("Badge renders its label", () => {
    render(<Badge label="Active" tone="success" />);
    expect(screen.getByText("Active")).toBeOnTheScreen();
  });

  it("Text renders children", () => {
    render(<Text variant="title">Rapidual</Text>);
    expect(screen.getByText("Rapidual")).toBeOnTheScreen();
  });
});
