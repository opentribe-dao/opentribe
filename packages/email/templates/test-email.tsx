import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from "@react-email/components";

export const TestEmail = () => (
  <Html>
    <Head />
    <Preview>Test Email</Preview>
    <Body style={{ backgroundColor: "#000" }}>
      <Container>
        <Text style={{ color: "#fff" }}>Hello World</Text>
      </Container>
    </Body>
  </Html>
);

TestEmail.PreviewProps = {
  name: "Test",
};

export default TestEmail;
