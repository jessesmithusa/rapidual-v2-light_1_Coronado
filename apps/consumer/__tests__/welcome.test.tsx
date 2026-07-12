import { render, screen } from "@testing-library/react-native";
import Welcome from "../app/(auth)/welcome";

describe("Welcome screen", () => {
  it("shows the brand pitch and primary CTAs", async () => {
    render(<Welcome />);
    expect(await screen.findByText("Create account")).toBeOnTheScreen();
    expect(screen.getByText("I already have an account")).toBeOnTheScreen();
    expect(screen.getByText(/94%\+/)).toBeOnTheScreen();
  });
});
