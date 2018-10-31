#include <math.h>
#include <opencv2/core/core.hpp>

using namespace cv;
using namespace std;

cv::Vec3d* Mix(cv::Vec3d a1, cv::Vec3d a2, float linear) {
	return &(a1 * (1 - linear) + linear * a2);
}

float fract(float x) {
	return x - int(x);
}

void InitMat(cv::Mat& m, float(*p)[3])
{
	for (int i = 0; i<m.rows; i++)
		for (int j = 0; j<m.cols; j++)
			m.at<float>(i, j) = *(*(p + i) + j);
}

double dot(cv::Vec3d a, cv::Vec3d b) {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

void Div(cv::Vec3d* a, float b) {
	a[0] = a[0] / b;
	a[1] = a[1] / b;
	a[2] = a[2] / b;
}

cv::Vec3d safeAt(cv::Mat* src, int x, int y) {
	if (x < 0 || y < 0 || x >= (*src).cols || y >= (*src).rows) {
		return cv::Vec3d(0, 0, 0);
	}
	return Vec3d(
		(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) / 255,
		(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) / 255,
		(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y) / 255
	);
}

float clamp(float x, float a, float b) {
	if ( x < a ){
		return a;
	}
	else if ( x > b ){
		return b;
	}
	return x;
}

cv::Vec3d* MulTo3X3(cv::Vec3d p, const double* x) {
	return &cv::Vec3d(
		x[6] * p[2] + x[7] * p[1] + x[8] * p[0],
		x[3] * p[2] + x[4] * p[1] + x[5] * p[0],
		x[0] * p[2] + x[1] * p[1] + x[2] * p[0]
	);
}

cv::Vec3b Mat2Ved3d(Mat* x) {
	return (*x).at<cv::Vec3b>(1, 1);
}

Mat ReadFile(char* filename)
{
	FILE* read_image = fopen(filename, "rb");
	if (read_image == NULL)
	{
		printf("Image Not Found\n");
	}

	fseek(read_image, 0, SEEK_END);
	int fileLen = ftell(read_image);
	fseek(read_image, 0, SEEK_SET);

	unsigned char* pre_image = (unsigned char *)malloc(fileLen);
	size_t data = fread(pre_image, 1, fileLen, read_image);

	// Printed and verify the values
	printf("File Size %d\n", fileLen);
	printf("Read bytes %d\n", data);

	fclose(read_image);

	vector<unsigned char> buffer(pre_image, pre_image + data);
	return imdecode(buffer, IMREAD_ANYCOLOR);
}

cv::Mat* B2M(unsigned char* buffer, int buffer_size) {
	vector<uchar>::size_type size = buffer_size;
	std::vector<uchar> data(buffer, buffer + size);
	cv::Mat dst = cv::imdecode(cv::Mat(data), CV_LOAD_IMAGE_COLOR);
	return &dst;
}

inline int dec(uchar x) { //convert uchar to int
	if (x >= '0'&&x <= '9') return (x - '0');
	else if (x >= 'a'&&x <= 'f') return (x - 'a' + 10);
	else if (x >= 'A'&&x <= 'F') return (x - 'A' + 10);
	return 0;
}