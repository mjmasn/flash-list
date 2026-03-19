import React from "react";
import { render } from "@quilted/react-testing";

import { useFlashListContext } from "../recyclerview/RecyclerViewContextProvider";
import { LayoutCommitObserver } from "../recyclerview/LayoutCommitObserver";
import { FlashList } from "..";

// Mock measureLayout to return fixed dimensions (required so the layout
// manager initialises — without this, zero dimensions trigger the
// background-rendering guard and no items are rendered).
jest.mock("../recyclerview/utils/measureLayout", () => {
  const originalModule = jest.requireActual(
    "../recyclerview/utils/measureLayout"
  );
  return {
    ...originalModule,
    measureParentSize: jest.fn().mockImplementation(() => ({
      width: 399,
      height: 899,
    })),
    measureFirstChildLayout: jest.fn().mockImplementation(() => ({
      x: 0,
      y: 0,
      width: 399,
      height: 899,
    })),
    measureItemLayout: jest.fn().mockImplementation(() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    })),
  };
});

describe("LayoutCommitObserver", () => {
  it("should not alter ref captured by child", () => {
    const ChildComponent = () => {
      const context = useFlashListContext();
      expect(context?.getRef()?.props.testID).toBe("child");
      expect(context?.getParentRef()?.props.testID).toBe("parent");
      expect(context?.getScrollViewRef()?.props.testID).toBe("child");
      expect(context?.getParentScrollViewRef()?.props.testID).toBe("parent");

      return null;
    };

    let commitLayoutEffectCount = 0;

    const content = (
      <FlashList
        testID="parent"
        data={[1]}
        renderItem={() => (
          <LayoutCommitObserver
            onCommitLayoutEffect={() => {
              commitLayoutEffectCount++;
            }}
          >
            <FlashList
              testID="child"
              data={[1]}
              renderItem={() => (
                <LayoutCommitObserver
                  onCommitLayoutEffect={() => {
                    commitLayoutEffectCount++;
                  }}
                >
                  <LayoutCommitObserver
                    onCommitLayoutEffect={() => {
                      commitLayoutEffectCount++;
                    }}
                  >
                    <ChildComponent />
                  </LayoutCommitObserver>
                </LayoutCommitObserver>
              )}
            />
          </LayoutCommitObserver>
        )}
      />
    );

    const renderResult = render(content);

    expect(commitLayoutEffectCount).toBe(3);

    // Force unmount to trigger cleanup of async operations
    renderResult.unmount();
  });
});
