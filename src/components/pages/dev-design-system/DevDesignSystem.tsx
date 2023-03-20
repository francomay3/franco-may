import React from "react";
import { useState } from "react";
import * as DesignSystem from "@/components/design-system";

const DevDesignSystem = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <DesignSystem.Stack gap="8">
      <h1>Dev Design System</h1>
      <DesignSystem.Inline gap="8">
        <DesignSystem.Card title="Button">
          <DesignSystem.Button>Button</DesignSystem.Button>
        </DesignSystem.Card>

        <DesignSystem.Card title="Icons">
          <DesignSystem.Inline>
            <DesignSystem.Icon id="menu" />
            <DesignSystem.Icon id="x" />
            <DesignSystem.Icon id="moon" />
            <DesignSystem.Icon id="sun" />
            <DesignSystem.Icon id="bold" />
            <DesignSystem.Icon id="italic" />
            <DesignSystem.Icon id="underline" />
            <DesignSystem.Icon id="strikeThrough" />
            <DesignSystem.Icon id="save" />
            <DesignSystem.Icon id="earth" />
            <DesignSystem.Icon id="invisible" />
            <DesignSystem.Icon id="plus" />
            <DesignSystem.Icon id="minus" />
            <DesignSystem.Icon id="move" />
            <DesignSystem.Icon id="edit" />
            <DesignSystem.Icon id="upload" />
            <DesignSystem.Icon id="image" />
            <DesignSystem.Icon id="visible" />
            <DesignSystem.Icon id="hidden" />
            <DesignSystem.Icon id="faQuestion" />
          </DesignSystem.Inline>
        </DesignSystem.Card>

        <DesignSystem.Card title="Card">
          <DesignSystem.Card>Card</DesignSystem.Card>
        </DesignSystem.Card>

        <DesignSystem.Card title="Dialog">
          <DesignSystem.Button onClick={() => setIsDialogOpen((prev) => !prev)}>
            Open Dialog
          </DesignSystem.Button>
          <DesignSystem.Dialog
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            title="Dialog"
          >
            Dialog Content
          </DesignSystem.Dialog>
        </DesignSystem.Card>

        <DesignSystem.Card title="Link">
          <DesignSystem.Link href="/dev-design-system">Link</DesignSystem.Link>
        </DesignSystem.Card>

        <DesignSystem.Card title="Tag">
          <DesignSystem.Tag tag={"Philosophy"} />
        </DesignSystem.Card>

        <DesignSystem.Card title="Action Buttons">
          <DesignSystem.Inline>
            <DesignSystem.ActionEditButton />
            <DesignSystem.ActionMinusButton onClick={() => null} />
            <DesignSystem.ActionMoveButton />
            <DesignSystem.ActionPlusButton onClick={() => null} />
          </DesignSystem.Inline>
        </DesignSystem.Card>
      </DesignSystem.Inline>
    </DesignSystem.Stack>
  );
};

export default DevDesignSystem;
