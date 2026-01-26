import { usePageContext } from '../../../hooks';
import GuidePage from '../GuidePage';
import { GuideTip, GuideTryIt } from '../../../components/guide';

const ChatGuide = () => {
    usePageContext('Guide', 'Using the Chat');
    return (
        <GuidePage>
            <header className="guide-page-header">
                <h1 className="guide-page-title">Using the Chat</h1>
                <p className="guide-page-description">
                    The chat interface is your main way of interacting with FabCore AI. 
                    Just type what you need in plain English—no special commands required.
                </p>
            </header>

            <section className="guide-section">
                <h2 className="guide-section-title">Natural Language Commands</h2>
                <div className="guide-section-content">
                    <p>
                        Atlas understands natural language, so you can ask for things the way you'd 
                        ask a coworker. Instead of memorizing commands, just describe what you need.
                    </p>
                    <p>
                        For example, instead of using a specific command syntax, you can simply type:
                    </p>
                    <p>
                        <strong>"Get me the details for job 24123"</strong> or <strong>"Show me overtime 
                        hours for last month"</strong> or <strong>"What's the production data for CNC-01?"</strong>
                    </p>
                    <p>
                        Atlas will figure out which tool to use and fetch the information for you.
                    </p>
                </div>

                <GuideTip>
                    You don't need to know the exact tool names. Just describe what you want and Atlas 
                    will pick the right tool automatically. Be specific about job numbers, dates, 
                    or machine IDs when you have them.
                </GuideTip>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Asking Follow-up Questions</h2>
                <div className="guide-section-content">
                    <p>
                        Atlas remembers the context of your conversation. After getting job info, 
                        you can ask follow-up questions without repeating yourself:
                    </p>
                    <p>
                        <strong>"What about the overtime on that job?"</strong> or <strong>"Can you 
                        compare that to job 24124?"</strong>
                    </p>
                    <p>
                        This makes it easy to drill down into details or explore related information 
                        without starting over each time.
                    </p>
                </div>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Data Visualizations</h2>
                <div className="guide-section-content">
                    <p>
                        When Atlas returns data, it often includes interactive visualizations. 
                        You'll see clickable cards in the chat that open detailed charts and tables.
                    </p>
                    <p>
                        Click on any data card to explore the full visualization on the Data page, 
                        where you can interact with charts, adjust views, and export data.
                    </p>
                </div>

                <GuideTip 
                    variant="success"
                    action={<GuideTryIt to="/chat">Try the Chat</GuideTryIt>}
                >
                    Try asking for something like "Show me production data for this week" and 
                    click on the resulting data card to see the full visualization.
                </GuideTip>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Tips for Better Results</h2>
                <div className="guide-section-content">
                    <p>
                        <strong>Be specific:</strong> "Job 24123" works better than "that job from last week."
                    </p>
                    <p>
                        <strong>Include dates when relevant:</strong> "Overtime hours from January 1st to January 15th" 
                        gets more precise results.
                    </p>
                    <p>
                        <strong>Ask for what you actually need:</strong> If you want a summary, say so. 
                        If you need the raw data, mention that too.
                    </p>
                </div>
            </section>
        </GuidePage>
    );
};

export default ChatGuide;
