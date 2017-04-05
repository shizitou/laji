fis.hook('bkcomponents');

fis.match('/components/(**.html)',{
	extras: {
		bKUIComponent: true
	}
});