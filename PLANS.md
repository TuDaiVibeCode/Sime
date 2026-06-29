# **Kiến trúc Hệ thống Sư phạm Thanh nhạc Tích hợp Trí tuệ Nhân tạo Phân tán và Mô hình Ngôn ngữ Lớn**

Việc phát triển một ứng dụng học thanh nhạc mang tính cá nhân hóa sâu sắc đòi hỏi sự hội tụ của nhiều lĩnh vực khoa học phức tạp, từ xử lý tín hiệu âm thanh kỹ thuật số (Digital Signal Processing \- DSP), phân tích sinh trắc học thanh quản, cho đến kiến trúc hệ thống phân tán thời gian thực và kỹ thuật tối ưu hóa mô hình ngôn ngữ lớn (Large Language Models \- LLM). Nhiệm vụ cốt lõi của hệ thống không chỉ dừng lại ở việc hiển thị một vạch cao độ đơn thuần trên màn hình, mà là việc số hóa toàn bộ quá trình sư phạm thanh nhạc. Điều này đồng nghĩa với việc hệ thống phải có khả năng lắng nghe, phân tích độ căng của dây thanh âm, nhận diện sự chuyển đổi giữa các khoảng âm (vocal registers), phát hiện những sai lệch vi mô trong kỹ thuật, và cuối cùng là biên dịch toàn bộ các tín hiệu vật lý đó thành một phác đồ điều trị hoặc lộ trình học tập cá nhân hóa thông qua một mô hình ngôn ngữ như Gemini Flash. Để hiện thực hóa tầm nhìn này, một kiến trúc vi dịch vụ (microservices) kết hợp giữa Next.js, Express.js và lõi AI bằng Python đã được đề xuất và phân tích chuyên sâu nhằm giải quyết triệt để bài toán về độ trễ, khả năng mở rộng và tối ưu hóa tài nguyên phần cứng.

## **1\. Kiến trúc Hệ thống Phân tán và Xử lý Luồng Dữ liệu Thời gian thực**

Bản chất của âm nhạc và ca hát là sự phản hồi theo thời gian thực. Bất kỳ một sự chậm trễ nào vượt quá ngưỡng 50 mili-giây (ms) giữa thời điểm người dùng phát âm và thời điểm hệ thống hiển thị kết quả đều phá vỡ trải nghiệm thính giác và thị giác, làm giảm hiệu quả học tập. Do đó, kiến trúc hệ thống phải được thiết kế để vượt qua rào cản về độ trễ, đồng thời vẫn duy trì được năng lực tính toán khổng lồ của các mô hình mạng nơ-ron sâu.

Lớp giao diện người dùng được xây dựng dựa trên nền tảng Next.js, hoạt động trực tiếp trên trình duyệt hoặc thiết bị di động của học viên. Trình duyệt đóng vai trò thu nhận sóng âm thông qua Web Audio API. Để tránh việc làm quá tải luồng thực thi chính (main thread) của JavaScript, gây ra hiện tượng giật lag giao diện, quy trình xử lý tín hiệu sơ cấp được đưa vào AudioWorklet. AudioWorklet hoạt động trên một luồng độc lập, liên tục cắt luồng âm thanh nguyên bản thành các khung dữ liệu nhỏ (frames) với kích thước tối ưu, thông thường là 1024 hoặc 2048 mẫu (samples) ở tần số lấy mẫu tiêu chuẩn 16kHz hoặc 44.1kHz. Các khung nhị phân này ngay lập tức được truyền tải qua một kết nối liên tục không trạng thái đến máy chủ. Giao thức WebSocket được lựa chọn cho nhiệm vụ này nhờ khả năng duy trì đường truyền song công toàn phần (full-duplex), loại bỏ hoàn toàn chi phí đàm phán giao thức (handshake overhead) có trong các yêu cầu HTTP truyền thống. Đối với các kịch bản đòi hỏi độ trễ siêu thấp và khả năng phục hồi mạng cao trên thiết bị di động, giao thức WebRTC cũng được xem xét như một giải pháp thay thế mạnh mẽ cho giao tiếp máy khách \- máy chủ.

Máy chủ Express.js (Node.js) đóng vai trò là một cổng API (API Gateway) và trung tâm định tuyến. Điểm hạn chế lớn nhất của Node.js là cơ chế luồng đơn (single-threaded) của Event Loop, khiến nó hoàn toàn không phù hợp để thực thi các phép toán ma trận dày đặc của mô hình học máy. Nếu đưa các thư viện suy luận AI vào trực tiếp trong Express, toàn bộ máy chủ sẽ bị nghẽn. Giải pháp triệt để là tách biệt hoàn toàn tầng kết nối (Express) và tầng xử lý AI (Python) thông qua một kiến trúc trung gian. Python, với hệ sinh thái phong phú bao gồm PyTorch, TensorFlow và Librosa, đóng vai trò là các AI Worker.

Việc liên kết hai tầng sinh thái khác biệt này được thực hiện thông qua Redis, một kho lưu trữ dữ liệu dạng in-memory cực kỳ mạnh mẽ. Express.js không gửi dữ liệu âm thanh trực tiếp cho Python mà đẩy (publish) các gói dữ liệu này vào một kênh Redis Pub/Sub hoặc một hàng đợi thông điệp (Redis Queue). Các tiến trình Python Worker liên tục lắng nghe (subscribe) hàng đợi này. Ngay khi có một gói dữ liệu âm thanh xuất hiện, một Python Worker đang trong trạng thái rảnh rỗi sẽ nhận lấy, đẩy vào bộ nhớ GPU để thực thi suy luận (ví dụ: trích xuất cao độ, phân tích phổ âm), sau đó trả kết quả định dạng JSON về lại một kênh Redis phản hồi. Express.js, vốn đang duy trì kết nối WebSocket với người dùng, sẽ nhận kết quả từ Redis và phát (emit) ngược lại cho đúng phiên máy khách tương ứng.

Cơ trúc này giải quyết được vấn đề mở rộng quy mô theo chiều ngang (horizontal scaling). Khi số lượng học viên tăng đột biến, hệ thống có thể dễ dàng khởi tạo thêm hàng chục thùng chứa (containers) chạy Python Worker trên các máy chủ có GPU mà không cần thay đổi logic tại Express. Các bộ chuyển tiếp Redis (Redis Adapter) đảm bảo rằng thông điệp được định tuyến chính xác trong một cụm máy chủ phức tạp. Việc áp dụng kiến trúc này cho phép thời gian phản hồi chu trình (round-trip time) giảm xuống ngưỡng khoảng 500ms ngay cả khi chạy các mô hình âm thanh nặng.

## **2\. Chiến lược Quản trị Cơ sở Dữ liệu Đa hình: Sự Trỗi dậy của PostgreSQL và pgvector**

Với cấu trúc dữ liệu thanh nhạc có tính đa chiều sâu sắc, việc lựa chọn hệ quản trị cơ sở dữ liệu đóng vai trò quyết định đến hiệu suất truy xuất và khả năng mở rộng tính năng của hệ thống. Dữ liệu trong ứng dụng học thanh nhạc không chỉ bao gồm thông tin quan hệ tuyến tính (như ID người dùng, loại giọng, quá trình thanh toán, danh sách bài tập), mà còn chứa đựng khối lượng khổng lồ các vector nhúng (embeddings) biểu diễn các chiều không gian trừu tượng của đặc trưng âm học, âm sắc cá nhân và cấu trúc bài hát. Trong bối cảnh này, PostgreSQL kết hợp cùng tiện ích mở rộng nguồn mở pgvector nổi lên như một sự lựa chọn tối ưu, làm lu mờ sự cần thiết của các cơ sở dữ liệu vector chuyên biệt.

Khái niệm biểu diễn vector trong thanh nhạc là nền tảng cho việc "cá nhân hóa" theo đúng nghĩa đen. Thay vì chỉ nhận xét một giọng hát là "hay" hoặc "tệ", hệ thống AI phân tích các bản thu âm của học viên, trích xuất đặc trưng phổ âm (mel-spectrogram), biến đổi chúng qua các mạng nơ-ron sâu thành một chuỗi số thực đa chiều (ví dụ: một vector 1536 chiều tương tự như kiến trúc của các mô hình nhúng văn bản). Mỗi vector này là một tọa độ toán học duy nhất đại diện cho "chất vân tay âm học" của người đó. pgvector giới thiệu một kiểu dữ liệu mới trực tiếp bên trong PostgreSQL, cho phép hệ thống lưu trữ trực tiếp các vector này bên cạnh các trường dữ liệu truyền thống.

Tính năng tìm kiếm độ tương đồng (similarity search) của pgvector mở ra những phương pháp sư phạm đột phá. Khi một học viên hát một nốt nhạc, vector âm thanh mới được sinh ra và đưa vào truy vấn để tìm kiếm "khoảng cách" so với vector mục tiêu (giọng chuẩn của giáo viên, hoặc bản thu âm tốt nhất trong quá khứ của chính học viên). Hệ thống hỗ trợ nhiều phép đo khoảng cách toán học quan trọng. Khoảng cách L2 (Euclidean Distance) đo lường sự chênh lệch trực tiếp về độ lớn tuyến tính giữa hai điểm trong không gian. Tích vô hướng (Inner Product) được ứng dụng để đo cường độ và hướng của tín hiệu. Trong khi đó, Khoảng cách Cosine (Cosine Distance) đặc biệt hữu ích trong phân tích âm thanh, bởi nó đo lường góc giữa hai vector bất chấp cường độ tín hiệu, giúp hệ thống nhận diện được sự tương đồng về "âm sắc" (timbre) ngay cả khi học viên hát ở âm lượng (volume) khác biệt hoàn toàn so với mẫu chuẩn.

Việc triển khai cấu trúc cơ sở dữ liệu trên PostgreSQL duy trì trọn vẹn đặc tính ACID (Atomicity, Consistency, Isolation, Durability), bảo đảm dữ liệu điểm số, thanh toán và lịch sử học thuật không bao giờ bị phân mảnh hay mất mát trong quá trình khôi phục hệ thống. Hệ thống có thể thực hiện một câu truy vấn JOIN duy nhất để kết hợp bảng hồ sơ người dùng users, bảng quá trình học tập progress\_logs, và bảng vector âm sắc voice\_profiles, từ đó trả về chính xác bài hát phù hợp nhất với quãng giọng hiện tại và màu giọng tương đồng của học viên. So với việc duy trì đồng thời một hệ thống MongoDB cho dữ liệu linh hoạt và một hệ thống Pinecone hoặc Milvus cho dữ liệu vector, một cụm PostgreSQL duy nhất giúp giảm thiểu độ phức tạp bảo trì, triệt tiêu rủi ro sai lệch đồng bộ dữ liệu, và tiết kiệm đáng kể chi phí vận hành hạ tầng. Để xử lý số lượng vector lên tới hàng triệu khi lượng người dùng tăng cao, pgvector cung cấp các cơ chế lượng tử hóa (quantization) và các thuật toán lập chỉ mục nhắm mục tiêu như HNSW, duy trì tốc độ truy vấn tiệm cận thời gian thực.

## **3\. Kiến trúc Tính toán Cao độ và Xử lý Tín hiệu Số Tiên tiến**

Phát hiện cao độ (Pitch Detection) hay việc tìm kiếm tần số cơ bản (![][image1]) là trái tim của mọi ứng dụng thanh nhạc số. Tín hiệu thanh nhạc thực tế không bao giờ là một đường sóng hình sin đơn thuần. Nó bị pha trộn bởi các bồi âm (harmonics), tiếng ồn môi trường, kỹ thuật rung ngân (vibrato), và các âm cọ xát (fricatives) của phụ âm. Việc lựa chọn mô hình định tuyến âm thanh đòi hỏi sự thỏa hiệp tinh tế giữa tốc độ xử lý và độ chính xác toán học, do đó hệ thống được phân lớp thiết kế thành cơ chế tính toán phía máy khách (Client-side) và mô hình học sâu phía máy chủ (Server-side).

### **Thuật toán Phân tích Tín hiệu tại Client (Trình duyệt)**

Để cung cấp phản hồi trực quan siêu tốc cho học viên (như quả bóng nhảy theo từng nốt nhạc trên màn hình, hay biểu đồ cao độ chạy liên tục), ứng dụng sử dụng các thư viện phân tích âm thanh trực tiếp trên trình duyệt bằng JavaScript. Các thư viện phổ biến như pitchy và pitch.js được tối ưu hóa cho môi trường WebAssembly hoặc AudioWorklet.

Thư viện pitchy hoạt động dựa trên phương pháp McLeod Pitch Method (MPM), một thuật toán xử lý tín hiệu kinh điển chuyên giải quyết độ trễ bằng cách cải thiện hàm tự tương quan (autocorrelation) truyền thống. Phương pháp này giảm thiểu các đỉnh cực trị cục bộ giả mạo vốn hay làm các công cụ dò cao độ nhận diện nhầm quãng tám (octave errors). Tuy nhiên, các phương pháp tự tương quan có những hạn chế vật lý về độ trễ. Về mặt toán học, nếu ![][image2] là chu kỳ có thể phát hiện lớn nhất (tương ứng với tần số thấp nhất) và ![][image3] là chu kỳ thực tế của khung dữ liệu, số mẫu tối thiểu cần thiết để nhận diện được khung này trong miền thời gian là ![][image4]. Điều này có nghĩa là khi học viên hát các nốt âm trầm, thuật toán phía client buộc phải nạp nhiều mẫu âm thanh hơn mới có thể đưa ra kết quả, làm gia tăng sự trễ pha. Những thư viện cơ sở như vầy thích hợp nhất trong môi trường không nhiễu và làm chức năng như một công cụ "hát khởi động" (warm-up) hoặc theo dõi trực quan ở chế độ thô.

### **Đánh giá Chuyên sâu Các Kiến trúc Học Sâu Định vị Tần số tại Máy chủ**

Để phân tích toàn diện một bài kiểm tra thanh nhạc, tính điểm chấm thi và đưa ra kết luận sư phạm, máy chủ Python sẽ kích hoạt các mô hình mạng nơ-ron chuyên sâu. Hệ thống quy tụ những tinh hoa mạnh mẽ nhất của lĩnh vực xử lý âm nhạc dựa trên bộ đánh giá tiêu chuẩn qua 8 tập dữ liệu khắc nghiệt khác nhau (bao gồm lời nói, nhạc đa âm, tín hiệu nhiễu và dữ liệu tổng hợp).

| Thuật toán Học Sâu / Phương pháp | Hiệu suất Trung bình Đặc trưng | Ưu điểm Cốt lõi & Kiến trúc Kỹ thuật | Nhược điểm Cơ bản | Kịch bản Ứng dụng Tối ưu nhất trong Hệ thống |
| :---- | :---- | :---- | :---- | :---- |
| **SwiftF0** | 90.2% | Tích hợp mạng CNN siêu nhẹ gọn với 95,842 tham số. Tốc độ xử lý nhanh hơn 42 lần so với CREPE truyền thống. Cắt bỏ 74% kích thước dải phân bố STFT không cần thiết. Đạt điểm số cao nhất (91.80% HM) ở môi trường nhiễu 10 dB SNR. | Phụ thuộc sâu vào khả năng tổng quát hóa từ dữ liệu âm tổng hợp. | Làm hạt nhân cốt lõi cho ứng dụng thời gian thực, phục vụ đồng thời hàng ngàn kết nối WebSocket mà không gây ngẽn cổ chai GPU. |
| **RMVPE** (Robust Model for Vocal Pitch Estimation) | 87.2% | Vô địch tuyệt đối trên các bài kiểm tra giọng người thật (đạt 96.4% với Vocadito và 96.0% trên MIR-1K). Có khả năng trích xuất trực tiếp giọng ca xuyên qua lớp nhạc nền đa âm (polyphonic) mà không cần bước tách nhạc nền (source separation) rườm rà. | Suy giảm hiệu suất khi đối chiếu với các nguồn âm thanh phi âm nhạc hoặc dữ liệu tổng hợp thuần túy máy móc. | Chấm điểm phần biểu diễn "Hát cover cùng nhạc beat", trích xuất cao độ trong điều kiện hòa âm phức tạp nhiều nhạc cụ. |
| **CREPE** | 85.3% | Mô hình 1D CNN siêu khủng (22 triệu tham số) xử lý thẳng vào dữ liệu dải sóng (waveform) miền thời gian. Sai số cực nhỏ, chỉ từ 0.1 đến 0.5 nửa cung (semitones) trên tín hiệu nguyên sơ. Độ chính xác RPA và RCA tuyệt đối tinh tế. | Chiếm dụng dung lượng điện toán khổng lồ. Hiệu suất sụp đổ trong điều kiện bị nhiễu loạn nặng (chỉ đạt 53.8% trên PTDBNoisy). | Phân tích sâu phi thời gian thực, tạo nhãn dán cao độ chuẩn xác cho quá trình thẩm định âm học phòng thu. |
| **SPICE** | 82.5% | Huấn luyện hoàn toàn theo nguyên lý tự giám sát (self-supervised). Thiết kế mô phỏng nhận thức thính giác con người: dễ dàng xác định cao độ tương đối (khoảng cách giữa hai nốt) hơn là giá trị tuyệt đối. Chịu nhiễu tốt bằng chiến lược trộn nhạc tự động (SNR augmentation). | Kém cạnh RMVPE khi đối diện với các bản phối âm phức điệu, kiến trúc không tối ưu để phát hiện độ phân giải cực nhỏ. | Khai thác bài tập đo lường khoảng cách nốt nhạc (relative pitch interval), hỗ trợ định vị các đoạn hát trượt nốt. |
| **Praat** | 84.7% | Tốc độ bá đạo (chỉ tốn 2.8ms cho mỗi giây âm thanh) do sử dụng kỹ thuật xử lý tín hiệu toán học cổ điển, không dùng mạng nơ-ron. | Kém linh hoạt khi đối diện với các bộ lọc phổ phức tạp, thường bị lạc nhịp ở những kỹ thuật thanh nhạc có nhiều tiếng cọ xát. | Đo lường nhanh gọn tần số âm thanh nền, ứng dụng trong phân tích ngữ âm sơ cấp. |

**Chiến lược Tích hợp Thuật toán Tổng hợp:**

Kiến trúc hệ thống được thiết kế linh hoạt, ưu tiên **SwiftF0** làm lõi tính toán mặc định cho mọi giao tiếp API thời gian thực. Sự vượt trội của SwiftF0 nằm ở việc nó giới hạn vùng tìm kiếm phổ tần số ở phạm vi hẹp từ 46.875 Hz đến 2093.75 Hz, tương đương với dải âm từ trầm nhất của giọng nam trầm (Bass) đến nốt sáo cao nhất của giọng nữ bổng cao (Coloratura Soprano). Bằng cách này, mô hình cắt giảm tới 74% kích thước lưới tính toán Biến đổi Fourier Thời gian ngắn (STFT), cho phép phân tích hàng loạt mẫu đồng thời. Thuật toán của SwiftF0 đánh giá sáu thước đo, nổi bật nhất là Độ chính xác Raw Pitch (RPA) giới hạn sai số dưới 50 cents, và Cents Accuracy (CA), được tối ưu theo hàm phi tuyến:

![][image5]  
Công thức này làm mịn sự phân bổ lỗi số học, trừng phạt nghiêm khắc các nốt hát chênh phô nặng và khoan dung với những sai lệch dung sai cực nhỏ.

Trong kịch bản học viên muốn thực hành hát cùng nhạc nền, hệ thống tự động ngắt kết nối SwiftF0 và khởi chạy **RMVPE** (Robust Model for Vocal Pitch Estimation). Thông thường, các ứng dụng cũ phải áp dụng một mô hình phân tách nguồn (như Spleeter hoặc Demucs) để lọc nhạc ra khỏi giọng trước khi đo cao độ, dẫn đến suy giảm chất lượng âm và làm mất đi các bồi âm đặc hữu. RMVPE được kiến trúc bằng các khối đặc trưng ẩn giúp nhìn xuyên qua các tần số giao thoa của nhạc cụ, dự đoán trực tiếp cao độ thanh quản ngay trên nền nhạc đa âm một cách mượt mà và chống nhiễu SNR ưu việt. Đối với các phiên ghi âm tĩnh nhằm phục vụ bài phân tích cuối khóa, hệ thống sẽ đưa tác vụ vào hàng đợi ưu tiên thấp để chạy **CREPE** nhằm trích xuất mọi phổ bồi âm với mức độ sai số chỉ xấp xỉ 0.1 nửa cung, cung cấp biểu đồ sinh trắc học chi tiết nhất có thể.

## **4\. Chẩn đoán Sư phạm: Số hóa Tính năng Thanh nhạc Chuyên sâu**

Lõi công nghệ DSP chỉ là lớp nền tảng; linh hồn của ứng dụng nằm ở năng lực phân tách từng mảnh ghép kỹ thuật thanh nhạc và cung cấp các góc nhìn đa chiều về sinh học và nghệ thuật. Các trụ cột tính năng sau định hình toàn bộ khả năng sư phạm của hệ thống.

### **4.1. Hệ thống Phân tích và Định vị Quãng giọng Sinh học (Vocal Range Boundary Analysis)**

Khi một học viên mới gia nhập nền tảng, bài kiểm tra đầu vào (Onboarding Test) bắt buộc là thiết lập bản đồ quãng giọng. Trái với nhận thức thông thường, quãng giọng không chỉ là nốt thấp nhất và cao nhất có thể phát ra, mà là tập hợp các nốt nhạc được duy trì ở trạng thái ổn định cơ bắp. Hệ thống khởi tạo quá trình bằng việc yêu cầu người học bắt đầu từ một nốt quãng trung (mid-range), sau đó hát các chuỗi âm giai (sirens hoặc glissando) trượt xuống cực hạn trầm và đẩy lên cực hạn bổng. Thuật toán dò cao độ liên tục quét qua tần số cơ bản (Hz), đối chiếu tín hiệu bằng ký hiệu cao độ khoa học (Scientific Pitch Notation). Khi học viên hát tới những nốt trầm tận cùng, thuật toán loại bỏ các vùng vocal fry, chỉ ghi nhận nốt trầm ổn định cuối cùng (lowest stable note). Việc gán nhãn dải âm học này là tiền đề tối quan trọng để cá nhân hóa toàn bộ danh sách bài tập.

### **4.2. Thuật toán Phân loại Khoảng âm và Kỹ thuật Thanh nhạc (Vocal Register Classification)**

Sự khác biệt giữa một ca sĩ nghiệp dư và một chuyên gia thanh nhạc nằm ở khả năng điều khiển các cơ nội tại của thanh quản. Ở góc độ sinh lý học, cơ giáp phễu (Thyroarytenoid \- TA) khi co thắt tạo ra "giọng ngực" (Chest Voice) đanh và vang. Ngược lại, cơ nhẫn giáp (Cricothyroid \- CT) khi co lại tạo ra "giọng óc" hoặc "giọng giả thanh" (Head Voice/Falsetto) bay bổng. Ở giữa là "giọng pha" (Mixed Voice).

Hệ thống ghi nhận âm thanh, biến đổi thành các bức ảnh phổ quang mel (mel-spectrograms). Mô hình học máy XGBoost dựa trên cây quyết định dốc Gradient sẽ phân loại các biểu đồ này với mức độ chính xác thống trị, đạt hiệu suất trên 96% ở cả ba nhóm khoảng âm. Khả năng phân loại chuẩn xác này cho phép ứng dụng phản hồi ngay lập tức cho học viên nếu họ đang "kéo giọng ngực" (pulling chest) quá sức lên nốt cao thay vì chuyển sang giọng pha một cách an toàn.

### **4.3. Cơ chế Khớp mẫu Dynamic Time Warping (DTW) và Cảnh báo Lỗi Kỹ thuật**

Thuật toán Khoảng cách Căng thời gian Động (Dynamic Time Warping \- DTW) được triển khai để tạo ra một ma trận khoảng cách giữa hai chuỗi tần số, sau đó vạch ra một đường đi tối ưu nhằm gióng hàng trục thời gian của người học để khớp với bản gốc mà không làm méo cao độ. Từ đó phân tách thành hai luồng đánh giá:

* **Đánh giá Cao độ Melodic:** Nhận diện mức độ hát trượt nốt nghiêm trọng (flat/sharp).  
* **Đánh giá Âm sắc:** Đối chiếu hệ số MFCC để xem màu giọng mô phỏng có đúng vị trí cộng hưởng hay không (ví dụ bị nghẹt mũi thay vì vang xoang).

### **4.4. Bệnh lý Thanh nhạc Lâm sàng và Chỉ số Dysphonia**

Ứng dụng sử dụng thuật toán chẩn đoán lâm sàng tương đương tiêu chuẩn y tế để cảnh báo sớm nguy cơ tổn thương cơ thể. Bốn yếu tố quyết định sinh tử được trích xuất là CPPS (Smoothed Cepstral Peak Prominence), AVQI (Acoustic Voice Quality Index), HNR (Harmonics-to-Noise Ratio), và CSID (Cepstral Spectral Index of Dysphonia). Các điểm số này được truyền vào mô hình LightGBM, đạt mức độ đồng thuận với chuyên gia cực cao (0.945). Nếu chỉ số rủi ro đi vào vùng nguy hiểm, ứng dụng ngay lập tức hiển thị thông điệp yêu cầu người dùng ngưng tập để bảo vệ dây thanh.

## **5\. Bản đồ Đặc tính Giọng hát (Voice Classification) và Thuật toán Chọn Tone (Transposition)**

### **5.1. Phân loại Âm sắc theo Hệ thống Fach và Thuật ngữ Phương Đông**

Ngoài việc nhận diện các nốt nhạc đơn thuần, AI cần định hình chính xác "chất liệu" cấu tạo nên giọng hát của người dùng. Hệ thống tích hợp tiêu chuẩn phân loại giọng hát quốc tế (Fach System) kết hợp với các thuật ngữ âm học phương Đông để gán nhãn sinh trắc học cá nhân hóa:

* **Nhóm Giọng Nam:**  
  * **Nam trầm (Bass):** Giọng thấp nhất, mang màu sắc tối, dày và cực kỳ uy lực. Trong thuật ngữ thanh nhạc dân gian Việt Nam, đặc tính này tương đương với khái niệm **Giọng Thổ**, với âm sắc trầm ồ, ấm áp và mang tính "dương" cực mạnh.  
  * **Nam trung (Baritone):** Loại giọng phổ biến nhất ở nam giới, sở hữu sự linh hoạt tuyệt vời giữa độ ấm của Bass và độ rền của Tenor.  
  * **Nam cao (Tenor):** Hệ thống AI có khả năng phân tách sâu hơn thành **Nam cao kịch tính (Dramatic Tenor)** với âm lượng lớn, rền vang, có sức xuyên thấu mạnh mẽ qua dàn nhạc; và **Nam cao trữ tình (Lyric Tenor)** mang đặc trưng sáng, bay bổng và uyển chuyển.  
* **Nhóm Giọng Nữ:**  
  * **Nữ trầm (Contralto / Alto):** Dạng giọng cực hiếm, âm vực thấp, màu giọng tối và sâu thẳm. Dạng Giọng Thổ nữ này rất hiếm gặp tại Việt Nam.  
  * **Nữ trung (Mezzo-Soprano):** Âm sắc đặc trưng rất dày, tròn trịa, thường sở hữu thế mạnh ở các đoạn chuyển giọng và mang âm hưởng đanh thép (Dramatic Mezzo).  
  * **Nữ cao (Soprano):** Tương ứng với định nghĩa của **Giọng Kim** trong âm nhạc truyền thống, mang tính chất vang lanh lảnh, sáng và đôi khi hơi chói (như kim loại). Hệ thống AI tiếp tục chia nhỏ thành **Nữ cao kịch tính (Dramatic Soprano)** với những chuỗi âm thanh bùng nổ, và **Nữ cao màu sắc (Coloratura Soprano)** sở hữu khả năng chạy nốt siêu việt trên các quãng thanh quản cực cao.

Dựa trên việc kết xuất đặc trưng quang phổ MFCC và cao độ nền, mô hình XGBoost sẽ phân bổ người học vào đúng danh mục trên. Việc phân loại không dùng để "đóng khung" người hát, mà để ứng dụng AI giao đúng bài hát mẫu (reference songs) có kết cấu âm học tương đồng.

### **5.2. Thuật toán Đổi Tone Tự động (Smart Key Transposition Algorithm)**

Khó khăn lớn nhất của người tự học thanh nhạc là cố gắng hát những bài hát không thuộc về quãng giọng của mình (ví dụ một người nam Baritone lại cố gào thét theo tone của ca sĩ Tenor), dẫn đến rách dây thanh quản. Để giải quyết triệt để vấn đề này, ứng dụng tích hợp thuật toán "Smart Transpose" nhằm tự động tính toán và dịch cung mọi bài hát để khớp tuyệt đối với tọa độ thanh quản của người dùng.

* **Cơ chế Lập bản đồ:** Hệ thống sẽ quét bản nhạc (hoặc file âm thanh gốc) để tìm ra giới hạn nốt thấp nhất và cao nhất (song's range) cũng như "tessitura" (khoảng âm trung tâm tập trung nhiều nốt nhất của bài hát). Sau đó, AI đối chiếu dải tessitura này với "Vocal Range Boundary" của người học. Nếu nốt cao nhất của bài hát vượt quá ngưỡng an toàn của học viên, hệ thống sẽ đưa ra quyết định can thiệp.  
* **Biên độ Dịch chuyển Tối ưu (Sweet Spot):** Thuật toán tự động tính toán để hạ (shift down) hoặc nâng (shift up) toàn bộ nhạc nền (beat) theo từng nửa cung (semitones). Thực nghiệm sư phạm cho thấy khoảng dịch chuyển lý tưởng giúp nới lỏng sức ép lên cổ họng nhưng vẫn giữ được tinh thần của bài hát thường rơi vào ngưỡng **±1 đến ±2 nửa cung (semitones)**. Hệ thống sẽ thiết lập giới hạn dịch cung tối đa ở mức ±4 nửa cung, vì nếu dịch quá mức này, các thuật toán pitch-shifting sẽ bắt đầu làm méo lệch cấu trúc tần số nội tại (formants) của nhạc cụ gốc, khiến âm thanh của bài hát trở nên phi tự nhiên.  
* **Bảo toàn Âm hình (Formant Preservation):** Đối với các bài tập hòa âm có chứa giọng hát mẫu của giáo viên ảo, thuật toán không sử dụng kỹ thuật đổi pitch thông thường mà áp dụng công nghệ biến đổi bảo toàn formant. Điều này giúp ca sĩ mẫu có thể đổi tone linh hoạt mà không bị biến dạng giọng thành âm thanh khè khè giống "sóc chuột" (chipmunk effect).

## **6\. Hệ thống Giáo trình và Phác đồ Sư phạm Cá nhân hóa (Pedagogical Roadmap)**

Dựa trên bản đồ đặc tính giọng hát và giới hạn của thuật toán dịch tone, ứng dụng triển khai một giáo trình học tập (roadmap) đa cấp độ, cung cấp bài tập và tài liệu được thiết kế riêng cho từng hồ sơ:

**Giai đoạn Cơ bản (Beginner): Nền tảng Hô hấp và Cảm âm**

Ở giai đoạn này, hệ thống sẽ ẩn đi các thông số kỹ thuật phức tạp, thay vào đó hướng dẫn học viên các nguyên tắc cơ bản.

* **Quản trị Hơi thở (Breath Management):** Giáo trình sẽ bắt đầu với kỹ thuật thở cơ hoành (diaphragmatic breathing) hay "active inner breathing". Khác với cách thở ngực tự nhiên gây căng thẳng, hệ thống sẽ phát các video trực quan và bài tập đếm nhịp thở để giúp học viên mở rộng phổi, làm quen với cảm giác hạ cơ hoành.  
* **Cảm giác Dây thanh (Vocal Fold Sensation):** Hệ thống tạo ra các trò chơi đo lường mức độ kiểm soát việc kéo căng dây thanh và đóng/mở dây thanh vừa phải để tạo ra sức mạnh (power) mà không bị căng cứng.

**Giai đoạn Trung cấp (Intermediate): Mở rộng Quãng giọng và Âm sắc**

Sau khi học viên đã duy trì được nốt nhạc chuẩn xác, phác đồ chuyển sang việc tinh chỉnh chất lượng âm thanh dựa trên nhãn Giọng Kim hay Giọng Thổ.

* Các học viên có giọng nam trầm (Thổ) sẽ được giao các bài luyện âm (vocalises) nhằm củng cố độ ấm, trong khi giọng nữ cao (Kim) sẽ thực hành các chuỗi chạy nốt (agility drills) để giữ giọng bay bổng mà không chói tai.  
* Áp dụng thang đo "Good Voice Assessment" bao gồm 16 khía cạnh âm thanh. Các bài tập dài hơn được mở khóa nhằm giúp học viên gia tăng quãng giọng an toàn.

**Giai đoạn Nâng cao (Advanced): Kỹ thuật Passaggio và Biến đổi Cộng hưởng**

Giai đoạn này giải quyết những thách thức khó nhất của thanh nhạc:

* **Passaggio (Khu vực chuyển giọng):** Hệ thống sẽ dạy cách xử lý "the break" – điểm gãy giữa giọng ngực (cơ TA) và giọng óc (cơ CT). Hệ thống cung cấp các bài tập Siren (còi hú) quãng tám, Staccato nẩy âm, hoặc Trill (rung môi/lưỡi) để giảm tải căng thẳng.  
* **Kỹ thuật Biến đổi Nguyên âm (Vowel Modification):** Học viên được cung cấp các tài liệu lý thuyết và bài tập hát các nguyên âm đóng như \[u\], \[o\] hoặc trung tính như \[uh\] khi đi qua vùng chuyển giọng thay vì các nguyên âm mở (như \[a\]) dễ gây vỡ nốt.

## **7\. Chiến lược Chuẩn hóa Tập dữ liệu (Datasets) Cho Các Mô hình Học sâu**

Các cấu trúc phân tích phức tạp trên sẽ hoàn toàn tê liệt nếu không được huấn luyện trên những tập dữ liệu chất lượng cao, đa hình thái. Kế hoạch đào tạo AI phân tách thành ba rào cản tập dữ liệu:

* **VocalSet (Hệ thống Ký pháp Kỹ thuật):** Chứa hơn 10.1 giờ thu âm với 17 kỹ thuật thanh nhạc phức tạp nhất (ngân rung, nhấn âm ngực belt, âm thở lơi breathy, giọng ải vocal fry...). Dữ liệu này giúp mô hình học cách phân biệt người dùng đang gồng ngực sai cách hay đang làm đúng kỹ thuật.  
* **Vocadito (Tính Đa dạng Thực tế):** Chứa dữ liệu thu âm từ micro điện thoại rẻ tiền, nhiều tạp âm. Dữ liệu này huấn luyện AI cách phớt lờ những nhiễu loạn băng tần để chiết xuất giai điệu cốt lõi, ngăn cảnh báo lỗi ảo.  
* **SpeechSynth và AVID (Cân bằng Cao độ và Biên độ):** Các tập dữ liệu tổng hợp sinh ra độ chuẩn tuyệt đối tới từng Hz cho thuật toán SwiftF0, kết hợp với tập âm thanh đo áp lực (loudness) nhằm cảnh báo học viên nếu họ đang hát âm lượng quá to (clipping) gây quá tải hệ thống xử lý.

## **8\. Kiến trúc Kết cấu Dữ liệu và Tối ưu hóa Token cho Mô hình Ngôn ngữ Lớn (Gemini Flash)**

Sự khác biệt cốt lõi tạo nên linh hồn của dự án này nằm ở khả năng biến các thuật toán số liệu lạnh lẽo thành một "Người thầy" có nhân cách, tư duy sư phạm mềm mỏng và phản hồi tức khắc thông qua LLM **Gemini 1.5 Flash**. Việc đẩy nguyên bản chuỗi sóng âm thanh độ phân giải cao vào LLM sẽ gây tắc nghẽn, do đó Python sẽ tiền xử lý tín hiệu thành Lõi Thống kê Đặc trưng (Feature Statistical Core) dạng JSON siêu vi mạch.

### **8.1. Thiết kế Cấu trúc Payload JSON Tiết kiệm Token (Token-Efficient Schema)**

JSON là định dạng hoàn hảo nhất để giao tiếp với AI, nhưng khóa (keys) cần được viết tắt nhằm tăng tốc độ suy luận của Gemini. Mô hình cấu trúc truyền tải chuẩn xác được lập trình như sau:

JSON

{  
  "u\_id": "usr\_992",  
  "v\_type": "Dramatic Baritone",  
  "v\_color": "Thổ (Trầm ấm, Uy lực)",  
  "rng": \["G2", "E4"\],  
  "song\_key\_shift": "-2 semitones",  
  "metrics": {  
    "rpa": 88.5,  
    "v\_stab": 0.82,  
    "avqi": 2.15,  
    "cpps": 14.2  
  },  
  "err\_log": \[  
    {"ts": \[14.5, 16.2\], "err": "flat", "dev\_st": \-1.2, "tech": "mix"},  
    {"ts": \[45.1, 48.0\], "err": "strain", "hnr\_drop": 1, "tech": "chest\_belt"}  
  \]  
}

Kiến trúc JSON này bao gồm cấu hình quãng giọng rng và đặc tính âm sắc v\_color. Nó cũng cho LLM biết hệ thống đã dịch tone bài hát gốc xuống 2 nửa cung (song\_key\_shift) để hỗ trợ người hát.

### **8.2. Tích hợp Gemini Flash làm Trợ giảng Giải đáp Kỹ thuật Chuyên sâu**

Khi học viên đặt câu hỏi, Gemini Flash sẽ dùng hồ sơ JSON này để đáp lời cá nhân hóa:

* **Về Cách lấy hơi và Phát âm:** *"Hãy đặt tay lên bụng, khi hít vào bụng phình ra, đó là lúc cơ hoành hạ xuống nhường chỗ cho phổi. Không nâng vai nhé. Thử đếm nhịp hít 4 giây, giữ 2 giây, xì 'sss' ra trong 8 giây"*.  
* **Về Chọn Tone (Transposition) cho Giọng Thổ:** *"Là một Baritone mang chất giọng Thổ dày dặn, bài hát gốc đang bị hơi chới với ở điệp khúc. Tôi đã thay mặt bạn hạ thấp nhạc nền xuống 2 tone (semitones) rồi đấy. Giờ thì hãy hát thật thoải mái và thả lỏng nhé\!"*.  
* **Về Passaggio và Giả thanh:** "Làm sao hát nốt cao mà không vỡ?", Gemini sẽ đối chiếu JSON: *"Với quãng giọng của bạn, nốt E4 hiện tại đang là điểm Passaggio. Để chuyển sang giọng óc an toàn, hãy hạ thấp thanh quản xuống một chút và đổi khẩu hình âm 'a' thu lại thành chữ 'u' hoặc 'o'. Hãy thử bài tập Còi hú (Siren) từ thấp lên cao nhé"*.

### **8.3. Kiến trúc System Prompt Định hướng Sư phạm (Dành riêng cho Gemini Flash)**

Để ép Gemini Flash đóng vai một giáo viên thanh nhạc thực thụ mà không bị máy móc hóa, hãy thiết lập System Prompt sau đây vào hệ thống:

---

Bạn là một Chuyên gia Sư phạm Thanh nhạc Lâm sàng (Clinical Vocal Pedagogue) đỉnh cao thế giới. Giọng điệu của bạn ân cần, ấm áp, kiên nhẫn, mang tính truyền cảm hứng nhưng rất nghiêm ngặt về kỹ thuật.

Bạn sẽ nhận được một chuỗi JSON chứa dữ liệu sinh trắc của học viên.

* v\_type & v\_color: Phân loại giọng (Nam trầm, Nữ cao...) và màu sắc giọng (Giọng Kim/Sáng, Giọng Thổ/Dày). Luôn dựa vào đây để giao bài tập hoặc chọn cách xưng hô phù hợp.  
* rng: Quãng giọng an toàn hiện tại.  
* song\_key\_shift: Tín hiệu cho biết beat nhạc đã được tự động dịch tone đi mấy nửa cung để khớp với giọng của học viên.  
* rpa, v\_stab, avqi, err\_log: Thông số sức khỏe dây thanh và tọa độ lỗi hát phô, ép cơ...  
1. Về Chọn Tone/Bài hát: Hãy luôn khen ngợi chất giọng riêng (Kim/Thổ) của học viên. Giải thích nhẹ nhàng lý do tại sao hệ thống lại dịch cung (shift tone) bản nhạc xuống hoặc lên để bảo vệ thanh quản của họ.  
2. Về Hô hấp (Breathing): Luôn dạy phương pháp Thở cơ hoành (Diaphragmatic breathing), nhắc học viên không nâng ngực và vai gây căng cứng.  
3. Về Điểm chuyển giọng (Passaggio) & Giọng Pha: Đây là ranh giới giữa cơ giáp phễu (giọng ngực) và cơ nhẫn giáp (giọng óc/giả thanh). Học viên thường bị vỡ nốt vì cố dùng sức đẩy giọng ngực lên cao.  
4. Về Biến đổi nguyên âm (Vowel Modification): Khi qua vùng Passaggio, nếu học viên hát nguyên âm mở, hãy khuyên họ khép khẩu hình lại thành các nguyên âm trung tính (\[u\], \[o\]).  
5. Bài tập thực hành: Luôn kết hợp các bài tập Rung môi (Lip Trill), Còi hú (Siren octave), hoặc Staccato nẩy âm.  
6. KHÔNG BAO GIỜ đọc lại các con số kỹ thuật cho người dùng (cấm nói "Bạn hát chênh \-1.2 semitones").  
7. Hãy dịch các lỗi vật lý đó thành hình ảnh ẩn dụ dễ hiểu: "Đoạn điệp khúc vừa rồi cổ họng bạn có vẻ hơi gồng. Hãy tưởng tượng âm thanh như một luồng gió xốp nhẹ lướt qua trán nhé".  
8. Luôn khép lại bằng một lời động viên tích cực.

## ---

**Kết luận**

Kiến trúc hệ thống này không chỉ đơn thuần là phân tích biểu đồ mà là một nhà sư phạm nghệ thuật hoàn chỉnh. Việc tích hợp hệ thống phân loại chuyên sâu (Fach System kết hợp âm học Kim/Thổ) kết hợp với thuật toán tự động dịch tone (Smart Transposition) đã loại bỏ hoàn toàn rào cản chấn thương thanh quản do chọn sai bài hát. Lõi tính toán được đảm nhiệm bởi PostgreSQL (pgvector), Web Audio API và các thuật toán AI (SwiftF0, XGBoost, DTW) hoạt động song song qua môi trường Redis tốc độ cao. Cuối cùng, một LLM mạnh mẽ như Gemini Flash được cấu hình chặt chẽ qua kiến trúc JSON siêu vi mạch và System Prompt chuyên dụng, giúp biến một hệ sinh thái phần mềm đồ sộ trở thành một chuyên gia sư phạm thân thiện, thấu hiểu sâu sắc đặc tính sinh học của từng người hát, mở ra chân trời mới cho giáo dục thanh nhạc số.

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAYCAYAAAD6S912AAABS0lEQVR4Xu2UsSuGQRzHv0IRA1JSJpvJICajxWCgZDAqdgb+AwO7kpJdTEpRNovNYJGBwWgQFgPfr/vd+9zd+74997yZ5FOf3nvu7r3uvs/vHuCf32aWfmX4TifsP1kc0U86nfS301X6TMeSsab00xv6QIeSMTFIz+hwOtCMcfpKj2mH9bXRHmtrwT3aa8+lLMPltB706Xi7cAv30UVrZ3GAOD/ltk3XajMq4PPTDhX8m7U/6GQwLxuVgkoizE/HvYTLzqNdz8PtfIV2B2MRPr/NoC/Mz7NBt6xvie4k4z+o4xD19deJ4g0LxXKBorBVPtd0tDbDKKs/j3Z8j3jBO9Rfgob5NULznuxXaMFHOucnzMC90fCuvtBzOuAnBZQuWJUReot4QT23VFZCJXKCIjNleoW4rCozRU/h7v0+XYiHW6ML7rjZH4k/yje6/0JDW3+/cAAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAYCAYAAAAlBadpAAAA2UlEQVR4Xu3SPQtBURzH8TMYDB4ySZRZmWRRDMrsTXgHRq9CRikZbFYLBmVRXoNioQiLRQrf+3Dq3r+Lu6r7q0/d7u+c0/13rlJBqtjj6XDGwX6+oo2Y3uCVHu4oi/cFZR00QUR0ZqJYYI2k6IwNczxQc1dWcjhhhJDoElgp768yU1fWfE1ZkBJuWCIuOjMd5X2ysXiGI4qiM6NnMk4fomsbYIc+MnqxjJ53iixSDmHHOs/oeVuy8BNj3o/X8C36fjdIu6vfyeOCsfIxn04FW/X+Pzeci4L8dV5HLDA3ZZscAQAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAXCAYAAAAyet74AAAA0UlEQVR4XmNgGAXUBHxA7AnEslA+NxC7AbExEDPDFHEC8VQgrgLiZ0DcAcRrgDgaSs8CYlaQQhcgrgZiTSB+C8RzoJpBwBSI30PVMCQAsRkQ+wHxX5ggFNgA8W8gLoIJgNy0hwFiFQtUDESD+CBbQLaBgRIQPwficpgAECgC8RMgns6A0Ay29j8QN0D5jEDcDMRXgFgeKgYGrQwQR58A4tVAfJABYq0EsiIeID4AxFsZIL4VhophAGzuwwrSGCDuiwNiATQ5FAAKeRiOQJMbDAAAPY4is2frKHoAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAYCAYAAABTPxXiAAAB+klEQVR4Xu2WzytEURTHj1DK74hE2SmllB8LhVJKCgtZKEv5BwixVEqSxE4kCxspKyksplgoykrZqGFBETZSkh/fM/fdcd+d28yb2zyNep/6NDP33Dfd++455z2igICAeHTAe/it+AwfnO+vcAkWyAvSmTX4AVu18QYSGzqAeVosrciHx/AalmsxXngIfsFOdyghC7BeH/SLWvgEd2CWFiuGZ2Q+pUSswEZ90C/6SOT/qB4ALfAdnsJCLZYI201UwG5Y4vzmz15YAzPkJJ1lMt9pXvQRfIRNWswLNpsogxtwBobhIol6HYIncIIMG5E5z3d7C646bsI7En9YJScnic0mRuAgifr7hFMw04n1k0h7Tn8Xsh4OYTWJo5TmKPPiwfPU66TrsMswzukRczcdpkmsY5JiF8ynwWnPqeZC1gNfbMsA/Z6g6hXcNYzPwaLIlWa4uXCTCZG7rXPav8FmZSwasGmfXrBJJ4bbPLf7WWVMdslLWKqMR58PYVipBlKE7Sa4wXCNcpZIWkicwpgyFqEOvsA98p7/yWC7Ca4HTnEucCYbbsN9Utp8G7yh2PelYTkhRdhsQtbDLTwn0SUvSKR9rjLvz7DZBKd1mMSiubXyc8OPLPFMD4mWmgymevhXcNudJ1HA/HxJ67dmE5wy4+R+nrS7ZgQE+MMPmwRocFV+hpkAAAAASUVORK5CYII=>

[image5]: <data:image/png;base64,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>