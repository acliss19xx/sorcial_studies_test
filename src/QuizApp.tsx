import React, { useState, useEffect } from 'react';
import { fetchCSVDataFromSheet } from './quizData'; // quizData.ts からインポート

// 型定義
interface QuestionData {
    id: string;
    page: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

interface QuestionProps {
    questionData: QuestionData;
    userAnswer: string | undefined;
    onAnswerChange: (questionId: string, selectedOption: string) => void;
    isExplanationRevealed: boolean;
}

// CSVデータを解析するヘルパー関数
const parseCSVData = (csvString: string): QuestionData[] => {
    const lines = csvString.trim().split('\n');
    // ヘッダー行をスキップし、空行を除外する
    const dataLines = lines.slice(1).filter(line => {
        const trimmedLine = line.trim();
        // 行が空でなく、カンマで分割したときに少なくとも6つの要素
        // (No, pageNo, question, options, answer, explanation) が存在することを確認
        return trimmedLine !== '' && trimmedLine.split(',').length >= 6;
    });

    // 問題文と解説の末尾にある数字（例: "。1"）を削除するヘルパー関数
    const removeTrailingNumber = (text: string): string => {
        // スペースまたは句読点の後に続く単一の数字を削除する
        // ただし、年号などの数字は残す
        return text.replace(/(\s*|\S)\d+($|\s*,)/, '$1').trim();
    };


    return dataLines.map((line, index) => {
        const parts = line.split(',');
        // CSVの列構造に合わせてインデックスを調整
        // 0: No (問題IDとして利用可能だが、ここではindexを使用)
        const page = (parts[1] || '').trim();          // pageNo
        let questionText = (parts[2] || '').trim();   // question
        const rawOptions = (parts[3] || '').trim();   // options
        const correctAnswer = (parts[4] || '').trim(); // answer
        let explanation = (parts[5] || '').trim();    // explanation (もし解説がカンマを含む場合は parts.slice(5).join(',').trim() )

        // 問題文と解説の末尾にある数字を削除
        questionText = removeTrailingNumber(questionText);
        explanation = removeTrailingNumber(explanation);


        // オプションを解析する (例: "(A)中国 (B)インド..." から "中国", "インド" を抽出)
        const options: string[] = [];
        const regex = /\(([A-D])\)([^(\(A-D)]*)/g;
        let match;
        while ((match = regex.exec(rawOptions)) !== null) {
            options.push(match[2].trim());
        }

        return {
            id: `q${index}`,
            page,
            questionText,
            options,
            correctAnswer,
            explanation,
        };
    });
};

// 単一の質問を表示するコンポーネント
const Question: React.FC<QuestionProps> = ({ questionData, userAnswer, onAnswerChange, isExplanationRevealed }) => {
    const { id, page, questionText, options, correctAnswer, explanation } = questionData;
    const isCorrect = userAnswer === correctAnswer;

    return (
        <div className="py-6 px-1 border-b border-slate-200 last:border-b-0 last:pb-0 mb-6 last:mb-0 dark:border-slate-700">
            {/* ページ番号を問題文と同じブロック内に移動 */}
            <div className="p-4 border border-slate-300 rounded-lg mb-4 bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
                {/* ページ番号と問題文を1行で表示 */}
                <h3 className="text-base text-slate-800 mb-3 text-left dark:text-slate-200"> {/* text-xl font-semibold を text-base に変更 */}
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full inline-block mr-3 align-middle dark:text-indigo-300 dark:bg-indigo-800">ページ: {page}</span>
                    <span className="align-middle ml-1 font-normal ">{questionText}</span> {/* font-semibold を削除し、font-normal を追加（または何も指定しない） */}
                </h3>
            </div>
            {/* 選択肢を2カラム表示にするためにグリッドレイアウトに変更 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border border-slate-300 rounded-lg bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
                {options.map((option, idx) => (
                    <label key={idx} className={`flex items-center p-2.5 rounded-md border border-slate-200 hover:bg-slate-100 transition-colors duration-150 cursor-pointer 
                        dark:border-slate-600 dark:hover:bg-slate-700 
                        has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400 
                        dark:has-[:checked]:bg-blue-700 dark:has-[:checked]:border-blue-500 dark:has-[:checked]:text-slate-100
                        ${isExplanationRevealed ? 'cursor-default opacity-70' : ''}`}>
                        <input
                            type="radio"
                            name={id}
                            value={option}
                            checked={userAnswer === option}
                            onChange={() => onAnswerChange(id, option)}
                            className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 rounded-full dark:bg-slate-700 dark:border-slate-500 dark:focus:ring-blue-600 dark:checked:bg-blue-500"
                            disabled={isExplanationRevealed}
                        />
                        <span className="ml-3 text-base text-slate-700 dark:text-slate-300">{option}</span>
                        {isExplanationRevealed && (
                            // 正解とユーザーの選択をハイライト
                            <div className="ml-auto pl-2">
                                {option === correctAnswer && (
                                    <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">正解</span>
                                )}
                                {userAnswer === option && userAnswer !== correctAnswer && (
                                    <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full dark:bg-red-700 dark:text-red-100">不正解</span>
                                )}
                            </div>
                        )}
                    </label>
                ))}
            </div>

            {isExplanationRevealed && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-slate-700 dark:border-slate-600">
                    <h4 className="text-base font-semibold mb-1 text-slate-700 dark:text-slate-200">解説:</h4>
                    <p className="text-sm text-slate-600 leading-relaxed dark:text-slate-300">{explanation}</p>
                </div>
            )}
        </div>
    );
};

const QUESTIONS_PER_PAGE = 5;

const QuizApp: React.FC = () => { // コンポーネント名を App から QuizApp に変更
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
    const [currentPage, setCurrentPage] = useState(0); // 0-indexed
    const [revealedExplanations, setRevealedExplanations] = useState<{ [key: string]: boolean }>({}); // 問題ごとの解説表示状態
    const [showOverallResults, setShowOverallResults] = useState<boolean>(false); // 全体の結果表示状態
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadQuestions = async () => {
            setLoading(true);
            setError(null);
            try {
                const csvData = await fetchCSVDataFromSheet();
                setQuestions(parseCSVData(csvData));
                // Reset state when data is loaded or reloaded
                setCurrentPage(0);
                setUserAnswers({});
                setRevealedExplanations({});
                setShowOverallResults(false);
            } catch (err) {
                console.error("問題データの読み込みに失敗しました:", err);
                setError(err instanceof Error ? err.message : String(err));
                setQuestions([]); // エラー時は問題を空にする
            } finally {
                setLoading(false);
            }
        };

        loadQuestions();
    }, []); // 初回マウント時のみ実行

    const handleAnswerChange = (questionId: string, selectedOption: string) => {
        // Prevent changing answer after it's revealed for the page
        if (revealedExplanations[questionId]) return;
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: selectedOption
        }));
    };

    const handleCheckCurrentAnswer = () => {
        const newRevealed: { [key: string]: boolean } = { ...revealedExplanations };
        currentQuestionsOnPage.forEach(q => {
            newRevealed[q.id] = true;
        });
        setRevealedExplanations(newRevealed);
    };

    const handleNextPage = () => {
        const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
        if (currentPage < totalPages - 1) {
            setCurrentPage(prev => prev + 1);
            // Optionally, hide explanations for the new page until checked
            // const newRevealed: { [key: string]: boolean } = {};
            // questions.slice((currentPage + 1) * QUESTIONS_PER_PAGE, (currentPage + 2) * QUESTIONS_PER_PAGE)
            //     .forEach(q => newRevealed[q.id] = false); // Or keep them revealed if already shown
            // setRevealedExplanations(prev => ({...prev, ...newRevealed}));
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
            // Optionally, handle revealed state for previous page
        }
    };

    const handleShowResults = () => {
        setShowOverallResults(true);
        // すべての解説を表示状態にする (任意、ここでは最終結果表示時に全解説を表示)
        const allRevealed: { [key: string]: boolean } = {};
        questions.forEach(q => {
            allRevealed[q.id] = true;
        });
        setRevealedExplanations(allRevealed);
    };


    const handleReset = () => {
        // データを再取得してリセット
        const loadQuestions = async () => {
            setLoading(true);
            setError(null);
            try {
                const csvData = await fetchCSVDataFromSheet();
                setQuestions(parseCSVData(csvData));
                setUserAnswers({});
                setCurrentPage(0);
                setRevealedExplanations({});
                setShowOverallResults(false);
            } catch (err) {
                console.error("リセット時の問題データの再読み込みに失敗しました:", err);
                setError(err instanceof Error ? err.message : String(err));
                setQuestions([]);
            } finally {
                setLoading(false);
            }
        };
        loadQuestions();
    };

    // スコア計算
    const calculateScore = () => {
        let correctCount = 0;
        questions.forEach(q => {
            if (userAnswers[q.id] === q.correctAnswer) {
                correctCount++;
            }
        });
        return correctCount;
    };

    const startIndex = currentPage * QUESTIONS_PER_PAGE;
    const endIndex = startIndex + QUESTIONS_PER_PAGE;
    const currentQuestionsOnPage = questions.slice(startIndex, endIndex);

    const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
    const isLastPage = currentPage === totalPages - 1;
    const isFirstPage = currentPage === 0;

    // Check if all questions on the current page have their explanations revealed
    const areAllCurrentPageAnswersRevealed = currentQuestionsOnPage.length > 0 && currentQuestionsOnPage.every(q => revealedExplanations[q.id]);
    // Check if at least one question on the current page has been answered by the user
    const isAnyQuestionOnPageAnswered = currentQuestionsOnPage.some(q => userAnswers[q.id] !== undefined);

    const canProceed = areAllCurrentPageAnswersRevealed || currentQuestionsOnPage.length === 0;

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans antialiased dark:bg-slate-900">
            <div className="max-w-3xl mx-auto bg-white rounded-xl overflow-hidden dark:bg-slate-800">
                <div className="p-6 sm:p-10">
                    <h1 className="text-3xl sm:text-4xl font-bold text-center text-slate-800 mb-10 dark:text-slate-100">社会期末テスト</h1>

                {loading && (
                    <p className="text-center text-slate-600 dark:text-slate-400 py-10">問題を読み込み中...</p>
                )}

                {error && (
                    <p className="text-center text-red-600 dark:text-red-400 py-10">エラー: {error}</p>
                )}

                {!loading && !error && questions.length > 0 && !showOverallResults && (
                    <div className="text-center mb-6 text-sm text-slate-500 dark:text-slate-400">
                        ページ {currentPage + 1} / {totalPages}
                    </div>
                )}

                {!loading && !error && questions.length > 0 ? (
                    <form onSubmit={(e) => e.preventDefault()}>
                        {currentQuestionsOnPage.map(questionData => (
                            <Question
                                key={questionData.id} // Ensure unique key
                                questionData={questionData}
                                userAnswer={userAnswers[questionData.id]}
                                onAnswerChange={handleAnswerChange}
                                isExplanationRevealed={revealedExplanations[questionData.id] || false}
                            />
                        ))}

                        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 mt-10">
                            {!showOverallResults && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handlePreviousPage}
                                        disabled={isFirstPage}
                                        className={`w-full sm:w-auto px-6 py-2.5 rounded-md font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                                            ${isFirstPage ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-400 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-200 dark:focus:ring-slate-500'}`}
                                    >
                                        前のページへ
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleCheckCurrentAnswer}
                                        disabled={areAllCurrentPageAnswersRevealed || !isAnyQuestionOnPageAnswered || currentQuestionsOnPage.length === 0 }
                                        className={`w-full sm:w-auto px-6 py-2.5 rounded-md font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                                            ${(areAllCurrentPageAnswersRevealed || !isAnyQuestionOnPageAnswered || currentQuestionsOnPage.length === 0) ? 'bg-blue-300 text-gray-100 cursor-not-allowed dark:bg-blue-800 dark:text-blue-300' : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400'}`}
                                    >
                                        このページの解答を確認する
                                    </button>

                                    {isLastPage ? (
                                        <button
                                            type="button"
                                            onClick={handleShowResults}
                                            disabled={!canProceed || currentQuestionsOnPage.length === 0 }
                                            className={`w-full sm:w-auto px-6 py-2.5 rounded-md font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                                                ${(!canProceed || currentQuestionsOnPage.length === 0) ? 'bg-purple-300 text-gray-100 cursor-not-allowed dark:bg-purple-800 dark:text-purple-300' : 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400'}`}
                                        >
                                            テスト結果を表示
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleNextPage}
                                            disabled={!canProceed || currentQuestionsOnPage.length === 0 }
                                            className={`w-full sm:w-auto px-6 py-2.5 rounded-md font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                                                ${(!canProceed || currentQuestionsOnPage.length === 0) ? 'bg-blue-300 text-gray-100 cursor-not-allowed dark:bg-blue-800 dark:text-blue-300' : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400'}`}
                                        >
                                            次のページへ
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="mt-6 text-center">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-md font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-red-300 disabled:text-gray-100 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-500 dark:disabled:bg-red-400 dark:disabled:text-gray-300"
                            >
                                テストをリセットする
                            </button>
                        </div>

                        {showOverallResults && (
                            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-center shadow-inner dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200">
                                <h2 className="text-2xl font-bold mb-3 text-blue-700 dark:text-blue-300">テスト結果</h2>
                                <p className="text-3xl font-bold">{calculateScore()} / {questions.length}</p>
                            </div>
                        )}
                    </form>
                ): <p></p>}
                {!loading && !error && questions.length === 0 && (
                    <p className="text-center text-slate-600 dark:text-slate-400 py-10">表示できる問題がありません。</p>
                )}
                </div>
            </div>
        </div>
    );
};

export default QuizApp; // QuizApp をデフォルトエクスポート
